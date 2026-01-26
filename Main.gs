/**
 * archivo: Main.gs
 * Versión: v28.44 - RESPETANDO CARGA BAJO DEMANDA Y CRITERIO DE MEMORIA
 */

const ID_SS_PARAMETROS = '1V2G1x_64aLUcM4M4hSTBSwI7yFNKQS4vGecLWvv_jDY';

function doGet() {
  try {
    var template = HtmlService.createTemplateFromFile('Index');
    template.CONFIG = get_system_params(); 
    var authData = get_dynamic_menu_logic();
    template.authorizedFolders = authData.html_files || []; 
    return template.evaluate()
        .setTitle('IA - Cecon Bokana')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (e) {
    return HtmlService.createHtmlOutput("Error: " + e.toString());
  }
}

function include(filename) {
  try {
    var template = HtmlService.createTemplateFromFile(filename);
    template.CONFIG = get_system_params();
    return template.evaluate().getContent();
  } catch(e) {
    return "";
  }
}

function get_system_params() {
  try {
    var ss = SpreadsheetApp.openById(ID_SS_PARAMETROS);
    var data = ss.getSheetByName('Admin').getDataRange().getValues();
    var config = {};
    for (var i = 0; i < data.length; i++) {
      if (data[i][0]) config[data[i][0].toString().trim()] = data[i][1].toString().trim();
    }
    return config;
  } catch(e) {
    return {};
  }
}

function get_user_data() { 
  return { ...get_dynamic_menu_logic(), system_params: get_system_params() };
}

function get_data_tabla_generica(seccion) {
  try {
    var auth = get_dynamic_menu_logic();
    var ss = SpreadsheetApp.openById(ID_SS_PARAMETROS);
    var hoja = ss.getSheetByName('Funcionalidades');
    var data = hoja.getDataRange().getValues();
    var busca = seccion ? seccion.toString().trim() : "";

    var listaPestanas = [];
    auth.menu.forEach(function(m) {
      if (m.sidebar === busca || (m.pestanas && m.pestanas.indexOf(busca) !== -1)) {
        listaPestanas = m.pestanas || m.pestañas || [];
      }
    });

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (row[2] !== auth.rol && row[3] !== auth.rol) continue;
      
      if (row[0].toString().trim() === busca || row[1].toString().trim() === busca) {
        
        var id_val   = row[4] ? row[4].toString().trim() : ""; 
        var gs_val   = row[5] ? row[5].toString().trim() : ""; 
        var html_val = row[6] ? row[6].toString().trim() : ""; 
        
        // CRITERIO PROFESIONAL: Si no hay archivos definidos, es desarrollo.
        if (!gs_val || !html_val) {
          return { 
            tipo: "desarrollo", 
            mensaje: "Módulo sin definir en Funcionalidades", 
            seccion: busca,
            pestañas: listaPestanas,
            debug: { fila: (i + 1), e: "N/A", f: "N/A", g: "N/A", nota: "Faltan archivos GS/HTML" }
          };
        }

        // Si hay archivos, INTENTAMOS la carga modular. 
        // No comprobamos globalThis antes para no romper la carga bajo demanda.
        var nombreModulo = gs_val.replace('.gs', '').trim();
        var moduloHandler = globalThis[nombreModulo];

        if (moduloHandler && typeof moduloHandler.obtener_interfaz === "function") {
          var res = moduloHandler.obtener_interfaz(extraer_id_url(id_val), busca);
          return { 
            ...res, 
            seccion: busca,
            pestañas: listaPestanas,
            modulo_form: html_val, 
            tipo: "datos_modulares"
          };
        } else {
          // Si llegamos aquí es porque el archivo está declarado pero su código 
          // está comentado o no tiene el objeto Namespace activo.
          return { 
            tipo: "desarrollo", 
            mensaje: "Lógica Modular no disponible (Comentada o inexistente)", 
            seccion: busca,
            pestañas: listaPestanas,
            debug: { fila: (i + 1), e: id_val, f: gs_val, g: html_val, nota: "El código no responde. Verifique si el .gs está comentado." }
          };
        }
      }
    }
    return { tipo: "error", mensaje: "Sección no encontrada", pestañas: [] };
  } catch(e) {
    return { tipo: "error", mensaje: e.toString(), pestañas: [] };
  }
}

function extraer_id_url(url) {
  if (!url) return "";
  var m = url.toString().match(/[-\w]{25,}/);
  return m ? m[0] : url;
}