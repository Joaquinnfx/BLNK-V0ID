<?php
// ===== CONFIGURACIÓN DEL FORMULARIO DE CONTACTO =====
// Cambia esta variable por tu email real donde quieres recibir los mensajes
$CONFIG_EMAIL_DESTINO = "contact@blnkv0id.com";

// Asunto del email (puedes personalizarlo)
$CONFIG_ASUNTO_EMAIL = "Nuevo mensaje de contacto desde BLNK-V0ID";

// Nombre de tu sitio web (para personalizar los mensajes)
$CONFIG_NOMBRE_SITIO = "BLNK-V0ID";

// ===== CONFIGURACIONES ADICIONALES =====
// Tiempo máximo de ejecución del script (en segundos)
$CONFIG_MAX_EXECUTION_TIME = 30;

// Tamaño máximo del mensaje (en caracteres)
$CONFIG_MAX_MESSAGE_LENGTH = 2000;

// ===== INFORMACIÓN IMPORTANTE =====
/*
Para que el formulario funcione correctamente en Hostinger:

1. Asegúrate de que tu hosting tenga PHP habilitado
2. El archivo process-form.php debe estar en la raíz de tu sitio
3. Cambia $CONFIG_EMAIL_DESTINO por tu email real
4. Si tienes problemas con la función mail(), puedes usar PHPMailer o SMTP

Para usar PHPMailer (más confiable):
- Instala PHPMailer vía Composer o descárgalo manualmente
- Modifica process-form.php para usar PHPMailer en lugar de mail()

Para usar SMTP:
- Configura las credenciales SMTP de tu hosting
- Usa la función mail() con headers SMTP apropiados
*/
?>
