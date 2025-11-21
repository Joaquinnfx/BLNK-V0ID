import crypto from "crypto"
import pool from "./db.js";

class ProductManager{
    constructor(pathFile){ //pathFile es la ruta del archivo json
        this.pathFile = pathFile;
    }

    generateNewId(){
        return crypto.randomUUID();
    }

    async getProducts(){
        try {
            const [rows] = await pool.query("SELECT * FROM products");
            return rows;
        } catch (error) {
            throw new Error("Error al traer los productos" + error.message);
        }
    }

    async addProduct(newProduct){
        const id = this.generateNewId();
        const { name, description, price, stock, image1, image2, image3, image4 } = newProduct;
        await pool.query(
        `INSERT INTO products (id, name, description, price, stock, image1, image2, image3, image4)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, description, price, stock, image1, image2, image3, image4]
        );
    return { id, ...newProduct };
    }   

    async setProductById(id,updates){
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(", ");
        const values = Object.values(updates);
        await pool.query(`UPDATE products SET ${fields} WHERE id = ?`, [...values, id]);
    }

    async deleteProductById(id){
         await pool.query("DELETE FROM products WHERE id = ?", [id]);
        return true;
    }

    async updateStock(productId, quantitySold) {
    try {
        // Evita stock negativo con GREATEST()
        await pool.query(
            "UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?",
            [quantitySold, productId]
        );
        console.log(`Stock actualizado para producto ${productId}: -${quantitySold}`);
    } catch (error) {
        throw new Error("Error al actualizar el stock: " + error.message);
    }
    }

}

export default ProductManager;

