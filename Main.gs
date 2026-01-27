/**
 * archivo: Main.gs
 * Versión: v30.13 - CONTROL DE LOG EVOLUCIONADO (0 = Producción)
 */

var ID_SS_PARAMETROS = "1V2G1x_64aLUcM4M4hSTBSwI7yFNKQS4vGecLWvv_jDY";
var _SS_CACHE = null;
var _CONFIG_CACHE = null;

function get_master_ss() {
  if (_SS_CACHE) return _SS_CACHE;
  _SS_CACHE = SpreadsheetApp.openById(ID_SS_PARAMETROS);
  return _SS_CACHE;
}

function get_system_params() {
  if (_CONFIG_CACHE !== null) return _CONFIG_CACHE;
  try {
    var ss = get_master_ss();
    var sheet = ss.getSheetByName('Admin');
    if (!sheet) return {};
    var data = sheet.getDataRange().getValues();
    var params = {};
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) params[data[i][0].toString().trim()] = data[i][1];
    }
    _CONFIG_CACHE = params;
    return _CONFIG_CACHE;
  } catch (e) { return {}; }
}

/**
 * FUNCIÓN DE LOG INTELIGENTE
 * 0 = Producción (Nada se muestra)
 * Distinto de 0 = Trazabilidad total
 */
function registrar_log(mensaje, origen) {
  var params = get_system_params();
  var nivelLog = params["Log"];

  // Si el valor es 0, salimos sin hacer nada (Modo Producción)
  if (nivelLog == 0) return;

  try {
    var fecha = Utilities.formatDate(new Date(), "GMT+1", "yyyy/MM/dd HH:mm:ss");
    var logMensaje = "[" + fecha + "] [" + (origen || "Sistema") + "] " + mensaje;
    
    console.log(logMensaje);
    return logMensaje;
  } catch (e) {
    // Fallback silencioso en caso de error en el propio log
  }
}

function get_user_data() { 
  var auth = get_dynamic_menu_logic();
  var params = get_system_params();
  
  registrar_log("Usuario identificado: " + auth.user, "Auth");
  return { nombre: auth.user, rol: auth.rol, menu: auth.menu, system_params: params };
}

function doGet(e) {
  var params = get_system_params();
  var template = HtmlService.createTemplateFromFile('Index');
  template.CONFIG = params;
  
  registrar_log("Acceso a la aplicación detectado", "doGet");
  return template.evaluate()
      .setTitle(params["Nombre Aplicacion"] || "Sistema")
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  var template = HtmlService.createTemplateFromFile(filename);
  template.CONFIG = get_system_params();
  return template.evaluate().getContent();
}

function buscar_configuracion_funcionalidad(nombre, rolUsuario) {
  var ss = get_master_ss();
  var sheet = ss.getSheetByName('Funcionalidades');
  var data = sheet.getDataRange().getValues();
  var busca = nombre ? nombre.toString().trim() : "";
  var rolUserComp = rolUsuario ? rolUsuario.toString().toLowerCase().trim() : "";

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rol1DB = row[2] ? row[2].toString().toLowerCase().trim() : "";
    var rol2DB = row[3] ? row[3].toString().toLowerCase().trim() : "";

    if (rol1DB !== rolUserComp && rol2DB !== rolUserComp && rol1DB !== "todos") continue;

    if (row[0].toString().trim() === busca || row[1].toString().trim() === busca) {
      return {
        fila: i + 1,
        sidebar: row[0],
        id_archivo: row[4] ? row[4].toString().trim() : "",
        nombre_gs: row[5] ? row[5].toString().replace('.gs','').trim() : "",
        nombre_html: row[6] ? row[6].toString().trim() : ""
      };
    }
  }
  return null;
}

function get_data_tabla_generica(seccion) {
  try {
    var auth = get_dynamic_menu_logic();
    var config = buscar_configuracion_funcionalidad(seccion, auth.rol);

    if (!config) {
      registrar_log("Acceso denegado o sección no encontrada: " + seccion, "Router");
      return { tipo: "error", mensaje: "Sección no encontrada o sin permisos." };
    }

    var modulo = globalThis[config.nombre_gs];

    if (!config.id_archivo || !config.nombre_gs || !modulo) {
      registrar_log("Módulo en desarrollo detectado: " + seccion, "Router");
      return {
        seccion: seccion,
        tipo: "desarrollo",
        mensaje: "Lógica no disponible",
        debug: {
          e: config.id_archivo || "Vacío",
          f: config.nombre_gs || "Vacío",
          g: config.nombre_html || "Vacío",
          fila: config.fila,
          nota: !modulo ? "Script no cargado" : "Faltan parámetros"
        },
        pestanas: auth.menu.find(m => m.sidebar === config.sidebar) ? 
                  auth.menu.find(m => m.sidebar === config.sidebar).pestanas : []
      };
    }

    if (typeof modulo.obtener_interfaz === 'function') {
      registrar_log("Cargando módulo: " + config.nombre_gs, "Router");
      var respuesta = modulo.obtener_interfaz(config.id_archivo, seccion);
      respuesta.seccion = seccion;
      respuesta.modulo_form = config.nombre_html;
      respuesta.modulo_nombre = config.nombre_gs;
      respuesta.tipo = "datos_modulares";
      return respuesta;
    } else {
      return { tipo: "error", mensaje: "Error de interfaz en " + config.nombre_gs };
    }

  } catch(e) {
    registrar_log("ERROR: " + e.toString(), "Router");
    return { tipo: "error", mensaje: "Error en Router: " + e.toString() };
  }
}