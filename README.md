Configuración básica del Proyecto: 

-Stripe gestiona los pagos y seguridad PCI DSS (No guardamos tarjetas dentro del proyecto, se encarga Stripe)
-El webhook valida que el pago realmente fue exitoso.
-El backend actualiza la base de datos (stock, órdenes...).
-El frontend (Handlebars) muestra todo dinámicamente.
