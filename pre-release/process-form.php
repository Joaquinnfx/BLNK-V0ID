<?php
// Incluir archivo de configuración
require_once 'config.php';

// Configuración del email
$to_email = "contact@blnkv0id.com";
$subject = $CONFIG_ASUNTO_EMAIL;

// Verificar si se envió el formulario
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Obtener los datos del formulario
    $name = isset($_POST['name']) ? trim($_POST['name']) : '';
    $email = isset($_POST['email']) ? trim($_POST['email']) : '';
    $message = isset($_POST['message']) ? trim($_POST['message']) : '';
    
    // Validar que todos los campos estén completos
    if (empty($name) || empty($email) || empty($message)) {
        $response = array(
            'success' => false,
            'message' => 'Please complete all fields.'
        );
        echo json_encode($response);
        exit;
    }
    
    // Validar formato del email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $response = array(
            'success' => false,
            'message' => 'Please enter a valid email address.'
        );
        echo json_encode($response);
        exit;
    }
    
    // Preparar el contenido del email
    $email_content = "Has recibido un nuevo mensaje de contacto desde tu sitio web BLNK-V0ID:\n\n";
    $email_content .= "Nombre: " . $name . "\n";
    $email_content .= "Email: " . $email . "\n";
    $email_content .= "Mensaje:\n" . $message . "\n\n";
    $email_content .= "Este mensaje fue enviado desde el formulario de contacto de tu sitio web.";
    
    // Headers del email
    $headers = "From: " . $email . "\r\n";
    $headers .= "Reply-To: " . $email . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // Intentar enviar el email
    if (mail($to_email, $subject, $email_content, $headers)) {
        $response = array(
            'success' => true,
            'message' => 'Message sent successfully! We will respond shortly.'
        );
    } else {
        $response = array(
            'success' => false,
            'message' => 'There was an error sending the message. Please try again.'
        );
    }
    
    // Devolver respuesta en formato JSON
    header('Content-Type: application/json');
    echo json_encode($response);
    
} else {
    // Si no es POST, redirigir a la página de ayuda
    header('Location: pages/help.html');
    exit;
}
?>
