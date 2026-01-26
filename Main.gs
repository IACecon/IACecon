/**
 * archivo: Main.gs
 * Versión Unificada v27 - Diccionario Dinámico y IDs Globales Protegidos
 */
var id_ss_parametros = '1V2G1x_64aLUcM4M4hSTBSwI7yFNKQS4vGecLWvv_jDY';
var id_ss_usuarios = '1Eq6fvd6DXOWyp4apY8uMscSmVd-e_PsljnZKQyqArDE';

function doGet() {
  try {
    var template = HtmlService.createTemplateFromFile('Index');
    var params = get_system_params();
    
    // Pasamos el diccionario completo para que Styles y otros puedan usar cualquier variable
    template.CONFIG = params;
    
    var authData = get_dynamic_menu_logic();
    template.authorizedFolders = authData.html_files || []; 
    return template.evaluate()
        .setTitle('IA - Cecon')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (e) { return HtmlService.createHtmlOutput("Error: " + e.toString()); }
}

function include(filename) {
  try {
    var template = HtmlService.createTemplateFromFile(filename);
    template.CONFIG = get_system_params(); 
    return template.evaluate().getContent();
  } catch(e) { return ""; }
}

/**
 * REVISIÓN DINÁMICA: Lee toda la hoja Admin (Col A = Clave, Col B = Valor)
 */
function get_system_params() {
  try {
    var ss = SpreadsheetApp.openById(id_ss_parametros);
    var hoja = ss.getSheetByName('Admin');
    var data = hoja.getDataRange().getValues();
    var config = {};
    
    for (var i = 0; i < data.length; i++) {
      var nombreVar = data[i][0] ? data[i][0].toString().trim() : "";
      var valorVar = data[i][1] ? data[i][1].toString().trim() : "";
      if (nombreVar !== "") {
        config[nombreVar] = valorVar;
      }
    }
    return config;
  } catch(e) { 
    // Fallback de seguridad por si la hoja está inaccesible
    return { "Color Corporativo": "#138275", "Color Selección": "#1bb09e" }; 
  }
}

function get_user_data() { 
  var auth = get_dynamic_menu_logic();
  var params = get_system_params();
  // Incluimos los parámetros en el retorno para que el Log de Scripts.html pueda mostrarlos
  return { ...auth, system_params: params }; 
}

function get_data_tabla_generica(seccion) { 
  try {
    var auth = get_dynamic_menu_logic();
    var rolUsuario = auth.rol;
    var ss = SpreadsheetApp.openById(id_ss_parametros);
    var hoja = ss.getSheetByName('Funcionalidades');
    var data = hoja.getDataRange().getValues();
    var busca = seccion ? seccion.toString().trim() : "";
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (row[2] !== rolUsuario && row[3] !== rolUsuario) continue;

      if ((row[1].toString().trim() === busca) || (row[0].toString().trim() === busca && row[1].toString().trim() === "")) {
        var id_val = row[4] ? row[4].toString().trim() : "";
        var gs_val = row[5] ? row[5].toString().trim() : "";
        var html_val = row[6] ? row[6].toString().trim() : "";

        if (!id_val || !gs_val || !html_val) {
          return { 
            tipo: "desarrollo", 
            mensaje: "Módulo en Desarrollo", 
            debug: { fila: i+1, e: id_val, f: gs_val, g: html_val, motivo: "Celdas vacías" } 
          };
        }

        var nombreModulo = gs_val.replace('.gs', '').trim();
        var moduloHandler = globalThis[nombreModulo];
        
        if (moduloHandler && typeof moduloHandler.obtener_interfaz === "function") {
          var res = moduloHandler.obtener_interfaz(extraer_id_url(id_val), busca);
          return { ...res, modulo_form: html_val, tipo: "datos_modulares" };
        } else {
          return { 
            tipo: "error_vinculacion", 
            mensaje: "Fallo de Vinculación GS", 
            debug: { fila: i+1, e: id_val, f: gs_val, g: html_val, objeto: nombreModulo } 
          };
        }
      }
    }
    return { tipo: "error", mensaje: "Sección no encontrada." };
  } catch(e) { return { tipo: "error", mensaje: e.toString() }; }
}

function extraer_id_url(url) {
  if (!url) return "";
  var m = url.toString().match(/[-\w]{25,}/);
  return m ? m[0] : url;
}