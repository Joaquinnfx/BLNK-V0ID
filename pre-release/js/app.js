import express from "express";
import { engine } from "express-handlebars";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db.js";
import ProductManager from "./productManager.js";
import CartManager from "./cartManager.js";
import stripeRouter from "./stripeRoutes.js";
import dotenv from "dotenv";

dotenv.config();

// Inicialización
const app = express();

//Variables de entorno
const isProduction = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 3000;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

//Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configura sistema de sesiones, permite que los usuarios tengan su propio estado persistente en el servidor x mas que no tengan login
app.use(
  session({
    secret: stripeSecretKey,
    resave: false, //evita que la sesion se vuelta a guardar en el servidor si NO hubo cambios
    saveUninitialized: false, //permite guardar nuevas sesiones que todavía no fueron modificadas (por ejemplo cuando un usuario nuevo entra y todavía no agregó nada al carrito).
      cookie: {
      secure: false, //indica que la cookie NO requiere HTTPS (en local debe ser false) (EN PRODUCCION CAMBIAR A TRUE )
      httpOnly: true, // evita acceso desde JS
      sameSite: "strict", // evita CSRF
      maxAge: 1000 * 60 * 60 * 24, // 1 día
    }, 
  })
);

//RUTA PARA STRIPE
app.use("/stripe", stripeRouter);

// Rutas absolutas y managers

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productManager = new ProductManager(path.join(__dirname, "../data/products.json"));
const cartManager = new CartManager();

// Archivos estáticos y Handlebars

app.use(express.static(path.join(__dirname, "../public")));
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "../views"));

// Middleware: crear carrito si no existe

app.use(async (req, res, next) => {
  if (!req.session.sessionId) {
    const cart = await cartManager.createCart();
    req.session.sessionId = cart.sessionId;
    console.log("Nuevo carrito creado:", cart.sessionId);
  }
  next();
});

// RUTAS DE VISTAS (Frontend)

app.get("/", async (req, res) => {
  try{
    const products = await productManager.getProducts();
    const featuredProduct = products[0];
    res.render("home", { title: "BLNK-V0ID | Home", featuredProduct, isHome: true });

  }catch(error){

    res.status(500).send("Error al cargar los productos: " + error.message);
  }
});

app.get("/about-us", (req, res) => {
  res.render("aboutus", { title: "BLNK-V0ID | About Us", isHome: false });
});

app.get("/help", (req, res) => {
  res.render("help", { title: "BLNK-V0ID | Help", isHome: false });
});

app.get("/refunds", (req, res)=>{
  res.render("refunds", { title: "BLNK-V0ID | Refund Policy", isHome: false });
})

app.get("/terms", (req, res)=>{
  res.render("terms", { title: "BLNK-V0ID | Terms & conditions", isHome: false });
})

app.get("/privacy-policy", (req, res)=>{
  res.render("policy", { title: "BLNK-V0ID | Privacy policy", isHome: false });
})

app.get("/products", async (req, res) => {
  try {
    const products = await productManager.getProducts();
    res.render("products", { title: "BLNK-V0ID | First Drop", products, isHome: false });
  } catch (error) {
    res.status(500).send("Error al cargar los productos: " + error.message);
  }
});

app.get("/cart", async (req, res) => {
  const items = await cartManager.getCartItems(req.session.sessionId);
  res.render("cart", { title: "Your Cart", items });
});

// Endpoint clásico desde formularios (ej: botones del front)
app.post("/cart/add/:pid", async (req, res) => {
  const { pid } = req.params;
  const quantity = req.body.quantity || 1;

  try {
    await cartManager.addToCart(req.session.sessionId, pid, quantity);
    res.json({ message: "Producto agregado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al agregar producto al carrito" });
  }
});

// API REST (para JS o panel admin)
const apiRouter = express.Router();

// PRODUCTOS
apiRouter.get("/products", async (req, res) => {
  try {
    const products = await productManager.getProducts();
    res.json({ message: "Lista de productos", products });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los productos" });
  }
});

apiRouter.post("/products", async (req, res) => {
  try {
    const newProduct = req.body;
    const products = await productManager.addProduct(newProduct);
    res.json({ message: "Producto agregado correctamente", products });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

apiRouter.put("/products/:pid", async (req, res) => {
  try {
    const { pid } = req.params;
    const updates = req.body;
    const products = await productManager.setProductById(pid, updates);
    res.json({ message: "Producto actualizado correctamente", products });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

apiRouter.delete("/products/:pid", async (req, res) => {
  try {
    const { pid } = req.params;
    const products = await productManager.deleteProductById(pid);
    res.json({ message: "Producto eliminado correctamente", products });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// BACKEND DEL CARRITO
apiRouter.get("/cart", async (req, res) => {
  const cart = await cartManager.getCart(req.session.sessionId);
  res.json(cart);
});

apiRouter.post("/cart/add/:pid", async (req, res) => {
  const { pid } = req.params;
  const { quantity } = req.body;
  await cartManager.addToCart(req.session.sessionId, pid, quantity || 1);
  res.json({ message: "Producto agregado correctamente" });
});

apiRouter.delete("/cart/delete/:pid", async (req, res) => {
  const { pid } = req.params;
  await cartManager.removeFromCart(req.session.sessionId, pid);
  res.json({ message: "Producto eliminado del carrito" });
});

apiRouter.put("/cart/update/:pid", async (req, res) => {
  const { pid } = req.params;
  const { quantity } = req.body;

  if (quantity <= 0) {
    await cartManager.removeFromCart(req.session.sessionId, pid);
    return res.json({ message: "Producto eliminado del carrito" });
  }

  await cartManager.updateQuantity(req.session.sessionId, pid, quantity);
  res.json({ message: "Cantidad actualizada correctamente" });
});

// Prefijo /api para agrupar endpoints
app.use("/api", apiRouter);

// Verificación de conexión a MySQL
try {
  const [rows] = await pool.query("SELECT DATABASE() AS db");
  console.log("Conectado a la base de datos:", rows[0].db);
} catch (error) {
  console.error("Error al conectar con MySQL:", error.message);
}

// Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
