// stripeRoutes.js
import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import pool from "./db.js";
import CartManager from "./cartManager.js";
import ProductManager from "./productManager.js";
import bodyParser from "body-parser";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const cartManager = new CartManager();
const productManager = new ProductManager();
const stripeRouter = express.Router();

stripeRouter.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      // Solo manejamos eventos exitosos
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const cartSessionId = session.metadata.cartSessionId;
        const purchasedSizes = JSON.parse(session.metadata.sizes);

        //Validacion del carrito en la sesion de stripe
        if(!cartSessionId){
          console.error("No se encontró el id del carrito en la sesión de Stripe");
          return res.status(400).send("Falta metadata.cartSessionId");
        }
 
        // 1 Obtener items del carrito
        const items = await cartManager.getCartItems(cartSessionId);

        // 2 Actualizar stock 
        for (const item of items) {
          await productManager.updateStock(item.id, item.quantity, item.size);
        }

        // 3 Registrar orden
        await pool.query(
          `INSERT INTO orders (id, stripe_session_id, total, customer_email, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [
            session.id,
            cartSessionId,
            session.amount_total / 100,
            session.customer_details?.email || null,
          ]
        );

        // 4 Guardar productos de la orden
        for (const item of items) {

          const matchedSize = purchasedSizes.find(s => s.id === item.id)?.size || null;
          await pool.query(
            `INSERT INTO order_items (order_id, product_id, quantity, price, size)
             VALUES (?, ?, ?, ?, ?)`,
            [session.id, item.id, item.quantity, item.price, matchedSize]
          );
        }

        // 5 Vaciar carrito
        await pool.query("DELETE FROM cart_items WHERE cart_id = ?", [
          cartSessionId,
        ]);
      }

      res.status(200).json({ received: true });
    } catch (err) {
      console.error("Error en webhook:", err);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// Crear sesión de checkout en Stripe
stripeRouter.post("/create-checkout-session", async (req, res) => {
  try {
    const sessionId = req.session.sessionId; //ID de la sesion del carrito
    const cart = await cartManager.getCartBySession(sessionId); //obetngo el carrito

    if (!cart) {
      return res.status(400).json({ error: "Cart empty or not found" });
    }

    const items = await cartManager.getCartItems(sessionId); //Obtengo los items del carrito

    //Verificar longitud de los items del carrito
    if (!items.length) {
      return res.status(400).json({ error: "There are no products in the cart" });
    }

    //Verificar stock antes del pago
    for (const item of items) {
      const [product] = await pool.query("SELECT stock FROM products WHERE id = ?", [item.id]);
      if (!product[0] || product[0].stock < item.quantity) {
        return res.status(400).json({
          error: `There is no stock of  ${item.name}. Available: ${product[0]?.stock || 0}`,
        });
      }
    }

    // Mapear productos del carrito a formato Stripe
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100), // en centavos
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.BASE_URL}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/cart`,
      metadata: {
      cartSessionId: req.session.sessionId, // esto conecta Stripe con el carrito local
      sizes: JSON.stringify(
        items.map(i => ({ id: i.id, size: i.size }))
      )
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Error creando sesión de Stripe:", error);
    res.status(500).json({ error: "Error creando la sesión de pago" });
  }
});

//Página de éxito (después del pago)
// stripeRouter.get("/success", async (req, res) => {
//   const sessionId = req.query.session_id;

//   if (!sessionId) return res.status(400).send("Missing session_id");

//   try {
//     // Obtener la orden ya creada por el webhook
//     const [orders] = await pool.query(
//       "SELECT * FROM orders WHERE id = ?",
//       [sessionId]
//     );

//     if (!orders.length) {
//       return res.status(404).send("Order not found");
//     }

//     const order = orders[0];

//     // Obtener los productos que YA fueron guardados por el webhook
//     const [items] = await pool.query(
//       "SELECT product_id, product_name AS name, quantity, price, size FROM order_items WHERE order_id = ?",
//       [sessionId]
//     );

//     res.render("success", {
//       layout: "main",
//       title: "Payment successful - BLNK-V0ID",
//       order_id: order.id,
//       customer_email: order.customer_email,
//       total_amount: order.total.toFixed(2),
//       items
//     });

//   } catch (err) {
//     console.error("Error al procesar éxito Stripe:", err);
//     res.status(500).send("Error loading success page");
//   }
// });

stripeRouter.get("/success", async (req, res) => {
  const sessionId = req.query.session_id;
  const localSession = req.session.sessionId;

  if (!sessionId) {
    return res.status(400).send("Falta el session_id");
  }

  try {
    // Obtener los datos del pago desde Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer_details"]
    });

    // 1 Guardar la orden en tu base de datos
    const [orderResult] = await pool.query(
      "INSERT INTO orders (stripe_session_id, customer_email, total) VALUES (?, ?, ?)",
      [
        session.id,
        session.customer_details?.email || "Cliente desconocido",
        session.amount_total / 100
      ]
    );

    const orderId = orderResult.insertId;

    // 2 Guardar los productos comprados
    const lineItems = session.line_items.data;
    //obtener talles desde Stripe metadata
    const purchasedSizes = JSON.parse(session.metadata.sizes || "[]");

   for (let i = 0; i < lineItems.length; i++) {
  const item = lineItems[i];
  const size = purchasedSizes[i]?.size || null;

  await pool.query(
    "INSERT INTO order_items (order_id, product_name, quantity, price, size) VALUES (?, ?, ?, ?, ?)",
    [
      orderId,
      item.description,
      item.quantity,
      item.amount_subtotal / 100,
      size
    ]
  );
}
    //3 Actualizar el stock en la base de datos
    for (const item of lineItems) {
      const name = item.description;
      const quantity = item.quantity;

      // Buscar producto por nombre
      const [productRows] = await pool.query("SELECT id FROM products WHERE name = ?", [name]);
      if (productRows.length > 0) {
        const productId = productRows[0].id;
        await productManager.updateStock(productId, quantity);
      } else {
        console.warn(`Producto no encontrado en DB: ${name}`);
      }
    }

    //4 Limpiar el carrito (por sessionId local)
    await cartManager.clearCart(localSession);

    //5 Renderizar la página de éxito con los datos
    res.render("success", {
      
      layout: "main",
      title: "Payment successful - BLNK-V0ID",
      order_id: orderId,
      customer_email: session.customer_details?.email || "Customer",
      total_amount: (session.amount_total / 100).toFixed(2),
      items: lineItems.map( (item,index) => ({
        name: item.description,
        quantity: item.quantity,
        price: (item.amount_subtotal / 100).toFixed(2),
        size: purchasedSizes[index]?.size || "N/A"
      }))
    });

  } catch (err) {
    console.error("Error al procesar éxito Stripe:", err);
    res.status(500).send("Error loading success page");
  }
});

export default stripeRouter;
