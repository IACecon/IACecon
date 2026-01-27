/**
 * archivo: Main.gs lolo
 * Versión: v30.22 - Corrección de duplicidad en Sesiones
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

function registrar_log(mensaje, origen) {
  var params = get_system_params();
  var nivelLog = params["Log"];
  if (nivelLog == 0) return;
  try {
    var fecha = Utilities.formatDate(new Date(), "GMT+1", "yyyy/MM/dd HH:mm:ss");
    var logMensaje = "[" + fecha + "] [" + (origen || "Sistema") + "] " + mensaje;
    console.log(logMensaje);
    return logMensaje;
  } catch (e) {}
}

/**
 * Punto de entrada único para la carga de la App
 */
function get_user_data() { 
  var params = get_system_params();
  var auth = get_dynamic_menu_logic();
  
  // REGISTRO ÚNICO DE APERTURA: Solo se ejecuta aquí al cargar/refrescar la app
  if (auth.mail) {
    registrar_evento_sesion(auth.mail, "Apertura", params);
    registrar_log("Sesión de apertura única registrada para: " + auth.mail, "Auth");
  }

  return { 
    nombre: auth.user, 
    rol: auth.rol, 
    menu: auth.menu, 
    system_params: params, 
    mail: auth.mail 
  };
}

function ejecutar_cierre_sesion() {
  var params = get_system_params();
  var email = Session.getActiveUser().getEmail().toLowerCase().trim();
  registrar_evento_sesion(email, "Cierre", params);
  return params["Invitado"] || params["Homeurl"] || "https://www.google.com";
}

function doGet(e) {
  var params = get_system_params();
  var template = HtmlService.createTemplateFromFile('Index');
  template.CONFIG = params;
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
    if (!config) return { tipo: "error", mensaje: "Sección no encontrada." };
    var modulo = globalThis[config.nombre_gs];
    if (!config.id_archivo || !config.nombre_gs || !modulo) {
      return {
        seccion: seccion,
        tipo: "desarrollo",
        mensaje: "Lógica no disponible",
        debug: { fila: config.fila, nota: !modulo ? "Script no cargado" : "Faltan parámetros" },
        pestanas: auth.menu.find(m => m.sidebar === config.sidebar) ? 
                  auth.menu.find(m => m.sidebar === config.sidebar).pestanas : []
      };
    }
    if (typeof modulo.obtener_interfaz === 'function') {
      var respuesta = modulo.obtener_interfaz(config.id_archivo, seccion);
      respuesta.seccion = seccion;
      respuesta.modulo_form = config.nombre_html;
      respuesta.modulo_nombre = config.nombre_gs;
      respuesta.tipo = "datos_modulares";
      return respuesta;
    }
  } catch(e) {
    registrar_log("ERROR: " + e.toString(), "Router");
    return { tipo: "error", mensaje: "Error en Router" };
  }
}
