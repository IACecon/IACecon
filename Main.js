/**
 * archivo: Main.gs
 */
var id_ss_parametros = '1V2G1x_64aLUcM4M4hSTBSwI7yFNKQS4vGecLWvv_jDY';
var id_ss_usuarios = '1Eq6fvd6DXOWyp4apY8uMscSmVd-e_PsljnZKQyqArDE';

function doGet() {
  try {
    var template = HtmlService.createTemplateFromFile('Index');
    var params = get_system_params();
    template.colorCorporativo = params.color;
    return template.evaluate()
        .setTitle('IA - Cecon')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (e) {
    return HtmlService.createHtmlOutput("error carga: " + e.toString());
  }
}

function include(filename) {
  var template = HtmlService.createTemplateFromFile(filename);
  var params = get_system_params();
  template.colorCorporativo = params.color;
  return template.evaluate().getContent();
}

function get_system_params() {
  try {
    var ss = SpreadsheetApp.openById(id_ss_parametros);
    var hoja = ss.getSheetByName('Admin');
    var data = hoja.getDataRange().getValues();
    return { 
      url: data[1][0] ? data[1][0].toString() : '', 
      color: data[1][1] ? data[1][1].toString() : '#138275' 
    };
  } catch(e) { return { url: '', color: '#138275' }; }
}

function get_user_data() { return get_validated_user_logic(); }

function get_data_tabla_generica(seccion) { 
  var trazabilidad = [];
  try {
    var ss = SpreadsheetApp.openById(id_ss_parametros);
    var hoja = ss.getSheetByName('Funcionalidades');
    var data = hoja.getDataRange().getValues();
    
    var busca = seccion ? seccion.toString().trim() : "";
    trazabilidad.push("busqueda: " + busca);

    var c_sb = 0, c_ps = 1, c_arc_id = 4, c_gs_sidebar = 5, c_gs_pestana = 6;
    
    for (var i = 1; i < data.length; i++) {
      var val_sb = data[i][c_sb] ? data[i][c_sb].toString().trim() : "";
      var val_ps = data[i][c_ps] ? data[i][c_ps].toString().trim() : "";
      
      var match = false;
      var archivoGS = "";

      if (val_sb === busca) {
        match = true;
        archivoGS = data[i][c_gs_sidebar] ? data[i][c_gs_sidebar].toString().trim() : "";
      } else if (val_ps === busca) {
        match = true;
        archivoGS = data[i][c_gs_pestana] ? data[i][c_gs_pestana].toString().trim() : "";
      }

      if (match) {
        var id_raw = data[i][c_arc_id] ? data[i][c_arc_id].toString().trim() : "";
        var id_limpio = extraer_id_url(id_raw);
        var nombreModulo = archivoGS.replace('.gs', '').trim();
        
        trazabilidad.push("match: " + nombreModulo);

        if (nombreModulo === "GestionUsuarios") {
          var res = api_usuarios_get_interfaz(id_limpio);
          if (res) {
            // Limpieza absoluta para serialización
            return {
              headers: JSON.parse(JSON.stringify(res.headers)),
              rows: JSON.parse(JSON.stringify(res.rows)),
              modulo_form: res.modulo_form.toString(),
              config: JSON.parse(JSON.stringify(res.config)),
              archivo_id: id_limpio,
              modulo: nombreModulo,
              debug: trazabilidad
            };
          }
        }
      }
    }
    return { tipo: "en_desarrollo", mensaje: "no encontrado", debug: trazabilidad };
  } catch(e) { 
    return { tipo: "error", mensaje: e.toString(), debug: trazabilidad }; 
  }
}

function router_modulo(modulo, metodo, params) {
  try {
    if (modulo === "GestionUsuarios" && metodo === "ejecutar_accion") {
      return api_usuarios_ejecutar_accion(params[0], params[1], params[2]);
    }
  } catch(e) { return "error router: " + e.toString(); }
}

function extraer_id_url(url) {
  if (!url) return "";
  var m = url.toString().match(/[-\w]{25,}/);
  return m ? m[0] : url;
}