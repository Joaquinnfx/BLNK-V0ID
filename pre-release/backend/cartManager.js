import { v4 as uuidv4 } from "uuid";
import pool from "./db.js";

class CartManager {
  //Crear un nuevo carrito (para nueva sesión)
  async createCart(sessionId = null) {
    try {
      if (!sessionId) sessionId = uuidv4(); // genera un id único
      const [result] = await pool.query(
        "INSERT INTO carts (session_id) VALUES (?)",
        [sessionId]
      );
      return { id: result.insertId, sessionId };
    } catch (error) {
      console.error("Error al crear el carrito:", error);
      throw new Error("Error al crear el carrito: " + error.message);
    }
  }

  // Obtener carrito por session_id
  async getCartBySession(sessionId) {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM carts WHERE session_id = ?",
        [sessionId]
      );
      if (rows.length === 0) return null;
      return rows[0];
    } catch (error) {
      throw new Error("Error al obtener el carrito: " + error.message);
    }
  }

  // Agregar un producto al carrito
  async addToCart(sessionId, productId, quantity = 1, size) {
    try {
      if (!size) {
        throw new Error("Debe seleccionarse un talle antes de agregar al carrito.");
      }
      // Buscar o crear carrito
      let cart = await this.getCartBySession(sessionId);
      if (!cart) cart = await this.createCart(sessionId);

      // Verificar si el producto existe
      const [productCheck] = await pool.query(
        "SELECT * FROM products WHERE id = ?",
        [productId]
      );
      if (productCheck.length === 0)
        throw new Error("El producto no existe en la base de datos.");

      // Verificar si el producto ya está en el carrito
      const [rows] = await pool.query(
        "SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? AND size = ?",
        [cart.id, productId, size]
      );

      if (rows.length > 0) {
        // Si ya existe, actualizar cantidad
        await pool.query(
          "UPDATE cart_items SET quantity = quantity + ? WHERE cart_id = ? AND product_id = ? AND size = ?",
          [quantity, cart.id, productId, size]
        );
      } else {
        // Si no existe, insertar nuevo ítem
        await pool.query(
          "INSERT INTO cart_items (cart_id, product_id, quantity, size) VALUES (?, ?, ?, ?)",
          [cart.id, productId, quantity, size]
        );
      }

      return { message: "Producto agregado correctamente", cartId: cart.id };
    } catch (error) {
      
      throw new Error("Error al agregar producto al carrito: " + error.message);
    }
  }

  // Obtener todos los productos del carrito
async getCartItems(sessionId) {
  try {
    const cart = await this.getCartBySession(sessionId);
    if (!cart) return [];

    const [rows] = await pool.query(`
      SELECT
        ci.id AS cart_item_id,
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.image1 AS image,
        ci.quantity,
        ci.size
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
	`, [cart.id]
	);

    return rows;

  } catch (error) {
    throw new Error("Error al obtener los productos del carrito: " + error.message);
  }
}

// Obtener carrito completo (estructura)
  async getCart(sessionId) {
    try {
      const cart = await this.getCartBySession(sessionId);
      if (!cart) return { items: [] };
      const items = await this.getCartItems(sessionId);
      return { cart, items };
    } catch (error) {
      throw new Error("Error al obtener el carrito: " + error.message);
    }
}

  // Eliminar un producto específico del carrito
  async removeFromCart(sessionId, productId) {
    try {
      const cart = await this.getCartBySession(sessionId);
      if (!cart) throw new Error("Carrito no encontrado");

      await pool.query(
        "DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?",
        [cart.id, productId]
      );

      return { message: "Producto eliminado del carrito" };
    } catch (error) {
      throw new Error("Error al eliminar producto del carrito: " + error.message);
    }
  };

   async updateQuantity(sessionId, productId, quantity) {
    try {
      // Buscar carrito activo por sesión
      const [cartRows] = await pool.query(
        "SELECT id FROM carts WHERE session_id = ?",
        [sessionId]
      );

      if (cartRows.length === 0) {
        throw new Error("Carrito no encontrado para esta sesión");
      }

      const cartId = cartRows[0].id;

      // Verificar si el producto ya está en el carrito
      const [itemRows] = await pool.query(
        "SELECT id FROM cart_items WHERE cart_id = ? AND product_id = ?",
        [cartId, productId]
      );

      if (itemRows.length === 0) {
        throw new Error("El producto no existe en el carrito");
      }

      // Actualizar cantidad
      await pool.query(
        "UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?",
        [quantity, cartId, productId]
      );

      return { message: "Cantidad actualizada correctamente" };
    } catch (err) {
      console.error("Error en updateQuantity:", err);
      throw err;
    }
  };

  // Vaciar el carrito completo
  async clearCart(sessionId) {
  try {
    const connection = await pool.getConnection();

    // Primero obtenemos el ID real del carrito
    const [cart] = await connection.query("SELECT id FROM carts WHERE session_id = ?", [sessionId]);
    if (!cart.length) {
      console.warn(`No se encontró carrito para la sesión ${sessionId}`);
      connection.release();
      return;
    }

    const cartId = cart[0].id;

    // Borrar los ítems del carrito correspondiente
    await connection.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);

    connection.release();
    console.log(`Carrito ${cartId} vaciado correctamente`);
  } catch (error) {
    console.error("Error al vaciar carrito:", error);
    throw error;
  }
};
};

export default CartManager;
