import dotenv from "dotenv"; 
dotenv.config(); 
import express from "express"; 
import { engine } from "express-handlebars"; 
import session from "express-session"; 
import path from "path"; 
import { fileURLToPath } from "url"; 
import pool from "./db.js"; 
import ProductManager from "./productManager.js"; 
import CartManager from "./cartManager.js"; 
import stripeRouter from "./stripeRoutes.js"; 
import {v4 as uuidv4} from "uuid";

// Inicialización
const app = express();

//Variables de entorno
const isProduction = process.env.NODE_ENV === "production"; const PORT = 
process.env.PORT || 3000; const stripeSecretKey = 
process.env.STRIPE_SECRET_KEY;

//Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configura sistema de sesiones, permite que los usuarios tengan su propio estado persistente en el servidor x mas que no tengan login
app.use(
  session({
    secret: stripeSecretKey,
    resave: false, //evita que la sesion se vuelva a guardar en el servidor si NO hubo cambios
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
  try{
    if (!req.session.sessionId) {
      const cart = await cartManager.createCart();
      if( !cart?.sessionId ){
        return res.status(500).json( {error: "Error creando el carrito"} )
      };
      req.session.sessionId = cart.sessionId;
      console.log("Nuevo carrito creado:", cart.sessionId);
    };
    req.session.save(error => {
      if(error){
        console.error("Error guardando la sesión:", error);
      }
    });

    next();
  }catch(error){
    res.status(500).json({ error: "Error interno al gestionar el carrito" })
  }
});

//MODO LANZAMIENTO: Teaser temporal
const MAINTENANCE_MODE = false;

app.use((req, res, next) => {
  if (MAINTENANCE_MODE && req.path !== "/teaser") {
    return res.render("teaser", {
      title: "Coming Soon – BLNK-V0ID",
      isMaintenance: true
    });
  }
  next();
});


// RUTAS DE VISTAS (Handlebars)
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

app.get("/terms-conditions", (req, res)=>{
  res.render("privacy-terms", { title: "BLNK-V0ID | Privacy policy", isHome: false });
})

app.get("/products", async (req, res) => {
  try {
    const products = await productManager.getProducts();
    res.render("products", { title: "BLNK-V0ID | First Drop", products, isHome: false });
  } catch (error) {
    console.error("Error en /products:", error);
    return res.render("products", { title: "BLNK-V0ID | First Drop", products: [], error: "No se pudo cargar los productos" });
  }
});

app.get("/cart", async (req, res) => {
  try {
    const items = await cartManager.getCartItems(req.session.sessionId);
    return res.render("cart", { title: "Your Cart", items });
  } catch (error) {
    console.error("Error en /cart:", error);
    return res.render("cart", { title: "Your Cart", items: [], error: "No se pudo cargar el carrito" });
  }
});

// Endpoint clásico desde formularios
app.post("/cart/add/:pid", async (req, res) => {
  const { pid } = req.params;
  const quantity = req.body.quantity || 1;
  const size = req.body.size;

  try {
    await cartManager.addToCart(req.session.sessionId, pid, quantity, size);
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
  try{
    if(!req.session.sessionId){
      return res.status(400).json({ error: "No existe sesion de carrito" });
    }
    const cart = await cartManager.getCart(req.session.sessionId);
    res.json(cart);
  }catch(error){
    res.status(500).json({ error: "Error al obtener el carrito" });
  }
});

apiRouter.post("/cart/add/:pid", async (req, res) => {
  try{
    const { pid } = req.params;
    const { quantity } = req.body;
    await cartManager.addToCart(req.session.sessionId, pid, quantity || 1);
    res.json({ message: "Producto agregado correctamente" });
  }catch(error){
    res.status(500).json({ error: "Error al agregar el producto al carrito" });
  }
});

apiRouter.delete("/cart/delete/:pid", async (req, res) => {
  try{
    const { pid } = req.params;
    await cartManager.removeFromCart(req.session.sessionId, pid);
    res.json({ message: "Producto eliminado del carrito" });
  }catch(error){
    res.status(500).json({ error: "Error al eliminar el producto del carrito" });
  }
});

apiRouter.put("/cart/update/:pid", async (req, res) => {
  try{
    const { pid } = req.params;
    const { quantity } = req.body;
    if (quantity <= 0) {
      await cartManager.removeFromCart(req.session.sessionId, pid);
      return res.json({ message: "Producto eliminado del carrito" });
    }
    await cartManager.updateQuantity(req.session.sessionId, pid, quantity);
    res.json({ message: "Cantidad actualizada correctamente" });
  }catch(error){
    res.status(500).json({ error: "Error al actualizar la cantidad del producto" });
  }

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

// Manejo global de errores (seguridad)
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).send("Internal server error");
});

// Servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo`);
});

