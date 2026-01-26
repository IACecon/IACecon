/**
 * archivo: Main.gs
 * Versión: v29.02 - FIX INCLUDE & STYLES
 */

const ID_SS_PARAMETROS = '1V2G1x_64aLUcM4M4hSTBSwI7yFNKQS4vGecLWvv_jDY';

// --- CACHÉ DE EJECUCIÓN (SINGLETON) ---
var _CACHE = {
  ss: null,
  config: null,
  auth: null
};

function get_master_ss() {
  if (_CACHE.ss) return _CACHE.ss;
  try {
    _CACHE.ss = SpreadsheetApp.openById(ID_SS_PARAMETROS);
    return _CACHE.ss;
  } catch(e) { throw new Error("Error BD: " + e.toString()); }
}

function doGet() {
  try {
    var template = HtmlService.createTemplateFromFile('Index');
    
    // 1. Carga de datos (Optimizada)
    var config = get_system_params(); 
    var authData = get_dynamic_menu_logic();
    
    // 2. Pasamos datos a la plantilla principal
    template.CONFIG = config;
    template.authorizedFolders = authData.html_files || []; 
    
    return template.evaluate()
        .setTitle('IA - Cecon Bokana')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (e) {
    return HtmlService.createHtmlOutput("Error Inicial: " + e.toString());
  }
}

/**
 * CORRECCIÓN IMPORTANTE:
 * Inyectamos CONFIG al incluir archivos para que Styles.html pueda leer los colores.
 */
function include(filename) {
  try {
    var template = HtmlService.createTemplateFromFile(filename);
    template.CONFIG = get_system_params(); // <-- Esto arregla los estilos dinámicos
    return template.evaluate().getContent();
  } catch(e) { 
    // Si falla, devuelve el error como comentario HTML para depurar
    return ""; 
  }
}

function get_system_params() {
  if (_CACHE.config) return _CACHE.config;
  try {
    var ss = get_master_ss();
    var sheet = ss.getSheetByName('Admin');
    if (!sheet) return {};
    var data = sheet.getDataRange().getValues();
    var config = {};
    for (var i = 0; i < data.length; i++) {
      if (data[i][0]) config[data[i][0].toString().trim()] = data[i][1].toString().trim();
    }
    _CACHE.config = config;
    return config;
  } catch(e) { return {}; }
}

function get_user_data() { 
  return { ...get_dynamic_menu_logic(), system_params: get_system_params() };
}

function get_data_tabla_generica(seccion) {
  try {
    var auth = get_dynamic_menu_logic();
    var ss = get_master_ss();
    var sheet = ss.getSheetByName('Funcionalidades');
    var data = sheet.getDataRange().getValues();
    var busca = seccion ? seccion.toString().trim() : "";

    var listaPestanas = [];
    auth.menu.forEach(function(m) {
      if (m.sidebar === busca || (m.pestanas && m.pestanas.indexOf(busca) !== -1)) {
        listaPestanas = m.pestanas || [];
      }
    });
    if (listaPestanas.length === 0 && busca !== "") listaPestanas = [busca];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (row[2] !== auth.rol && row[3] !== auth.rol) continue;
      
      if (row[0].toString().trim() === busca || row[1].toString().trim() === busca) {
        var id_val   = row[4] ? row[4].toString().trim() : ""; 
        var gs_val   = row[5] ? row[5].toString().trim() : ""; 
        var html_val = row[6] ? row[6].toString().trim() : ""; 
        
        if (!gs_val || !html_val) {
          return { tipo: "desarrollo", mensaje: "Config Incompleta", seccion: busca, pestanas: listaPestanas, debug: { fila: i+1, e:id_val, f:gs_val, g:html_val } };
        }

        var nombreModulo = gs_val.replace('.gs', '').trim();

        // BLINDAJE DE SEGURIDAD
        if (typeof globalThis[nombreModulo] === 'undefined') {
          return { tipo: "desarrollo", mensaje: "Lógica no disponible", seccion: busca, pestanas: listaPestanas, debug: { fila: i+1, e:id_val, f:gs_val, g:html_val, nota: "Módulo inactivo" } };
        }

        var moduloHandler = globalThis[nombreModulo];
        if (typeof moduloHandler.obtener_interfaz !== 'function') {
          return { tipo: "desarrollo", mensaje: "Error de Estructura", seccion: busca, pestanas: listaPestanas, debug: { fila: i+1, nota: "Falta funcion interfaz" } };
        }

        try {
          return { ...moduloHandler.obtener_interfaz(extraer_id_url(id_val), busca), seccion: busca, pestanas: listaPestanas, modulo_form: html_val, tipo: "datos_modulares" };
        } catch (execError) {
          return { tipo: "error", mensaje: "Error Ejecución: " + execError.toString(), pestanas: listaPestanas };
        }
      }
    }
    return { tipo: "error", mensaje: "Sección no encontrada", pestanas: [] };
  } catch(e) { return { tipo: "error", mensaje: e.toString(), pestanas: [] }; }
}

function extraer_id_url(url) {
  if (!url) return "";
  var m = url.toString().match(/[-\w]{25,}/);
  return m ? m[0] : url;
}