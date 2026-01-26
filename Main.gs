/**
 * archivo: Main.gs
 * Versión: v28.43 - Diferenciación de estados de desarrollo
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
        
        var nombreModulo = gs_val.replace('.gs', '').trim();
        var moduloHandler = globalThis[nombreModulo];

        // CASO 1: El módulo tiene archivos asignados pero no tiene lógica 'obtener_interfaz'
        if (gs_val !== "" && html_val !== "") {
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
            return { 
              tipo: "desarrollo", 
              mensaje: "Lógica Modular no implementada", 
              seccion: busca,
              pestañas: listaPestanas,
              debug: { 
                fila: (i + 1),
                e: id_val,
                f: gs_val,
                g: html_val,
                nota: "Los archivos existen pero el .gs no tiene la función obtener_interfaz"
              }
            };
          }
        } 
        
        // CASO 2: El módulo no tiene ni siquiera archivos asignados en la hoja de cálculo
        return { 
          tipo: "desarrollo", 
          mensaje: "Módulo sin definir en Funcionalidades", 
          seccion: busca,
          pestañas: listaPestanas,
          debug: { 
            fila: (i + 1),
            e: "N/A",
            f: "N/A",
            g: "N/A",
            nota: "Faltan parámetros básicos en las columnas E, F y G"
          }
        };
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