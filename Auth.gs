/**
 * archivo: Auth.gs
 * Versión: v29.04 - LECTURA ESTRICTA DE COLUMNA PESTAÑAS
 */

function get_validated_user_logic() {
  try {
    var emailSession = Session.getActiveUser().getEmail().toLowerCase().trim();
    
    // 1. Obtenemos parámetros usando la caché de Main.gs (Eficiencia)
    var params = get_system_params(); 
    
    // 2. Extraemos ID y abrimos la hoja de Usuarios (Base de datos externa)
    var id_str = params["Usuarios"] || "";
    var match = id_str.match(/[-\w]{25,}/);
    if (!match) return { nombre: "Error Config", rol: "Invitado", email: emailSession };
    
    var ss = SpreadsheetApp.openById(match[0]);
    var hoja = ss.getSheetByName('Usuarios');
    var values = hoja.getDataRange().getValues();
    var headers = values[0].map(h => h.toString().toLowerCase().trim());
    
    var idx_email  = headers.indexOf("mail");
    var idx_nombre = headers.indexOf("nombre");
    var idx_rol    = headers.indexOf("rol");
    
    if (idx_email === -1) idx_email = 1;
    if (idx_nombre === -1) idx_nombre = 0;
    if (idx_rol === -1) idx_rol = 2;

    for (var i = 1; i < values.length; i++) {
      if (values[i][idx_email].toString().toLowerCase().trim() === emailSession) { 
        return {
          nombre: values[i][idx_nombre] || "Usuario",
          rol: values[i][idx_rol] ? values[i][idx_rol].toString().trim() : "Invitado",
          email: emailSession,
          status: "Encontrado"
        };
      }
    }
    return { nombre: "Desconocido", rol: "Invitado", email: emailSession, status: "No encontrado" };
  } catch (e) {
    return { nombre: "Error", rol: "Invitado", email: e.toString() };
  }
}

function get_dynamic_menu_logic() {
  // 1. Comprobación de Caché (Singleton implementado en Main.gs)
  if (typeof _CACHE !== 'undefined' && _CACHE.auth) {
    return _CACHE.auth;
  }

  var menu_items = [];
  var html_files = [];
  
  try {
    var user = get_validated_user_logic();
    
    // Usamos la conexión maestra de Main.gs para no volver a abrir la hoja
    var ss = get_master_ss(); 
    var hoja = ss.getSheetByName('Funcionalidades');
    var values = hoja.getDataRange().getValues();
    
    // Normalizamos cabeceras para lectura técnica (elimina espacios y mayúsculas accidentales)
    var headers = values[0].map(h => h.toString().toLowerCase().trim());

    // --- LECTURA DIRECTA SIN ADIVINANZAS ---
    var c_sb   = headers.indexOf("sidebar");
    
    // Buscamos la columna que corresponde a "Pestañas"
    // (Al usar toLowerCase() en headers, buscará "pestañas" para coincidir con tu columna "Pestañas")
    var c_ps   = headers.indexOf("pestañas"); 
    
    var c_r1   = headers.indexOf("rol1");
    var c_r2   = headers.indexOf("rol2");
    
    // Para el HTML, intentamos 'archivo_html' o 'html'
    var c_html = headers.indexOf("archivo_html");
    if (c_html === -1) c_html = headers.indexOf("html");

    for (var i = 1; i < values.length; i++) {
      var f = values[i];
      
      // Filtro de Seguridad por Rol
      if (f[c_r1] === user.rol || f[c_r2] === user.rol) {
        
        var sidebar_name = f[c_sb] ? f[c_sb].toString().trim() : "";
        var pestaña_val  = (c_ps !== -1 && f[c_ps]) ? f[c_ps].toString().trim() : "";
        var html_name    = (c_html !== -1 && f[c_html]) ? f[c_html].toString().trim() : "";

        // Construcción del Menú
        if (sidebar_name !== "") {
          var item = menu_items.find(m => m.sidebar === sidebar_name);
          if (!item) {
            // Estructura limpia: 'pestanas' (sin ñ en el código JS para evitar errores de codificación)
            item = { sidebar: sidebar_name, titulo: sidebar_name, pestanas: [] };
            menu_items.push(item);
          }
          
          // Solo si hay dato en la columna Pestañas, lo añadimos
          if (pestaña_val !== "") {
            item.pestanas.push(pestaña_val);
          }
        }
        
        // Lista blanca de archivos HTML permitidos
        if (html_name !== "" && html_files.indexOf(html_name) === -1) {
          html_files.push(html_name);
        }
      }
    }
    
    var resultado = { 
      nombre: user.nombre,
      rol: user.rol,
      email: user.email,
      menu: menu_items, 
      html_files: html_files,
      status: user.status
    };
    
    // Guardamos en caché
    if (typeof _CACHE !== 'undefined') {
      _CACHE.auth = resultado;
    }
    
    return resultado;

  } catch (e) {
    return { nombre: "Error", rol: "Invitado", menu: [], html_files: [], error: e.toString() };
  }
}