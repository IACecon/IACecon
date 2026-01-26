/**
 * archivo: GestionUsuarios.gs
 */
/**
var GestionUsuarios = {

  obtener_interfaz: function(id_file) {
    try {
      var ss = SpreadsheetApp.openById(id_file);
      var tz = ss.getSpreadsheetTimeZone();
      var hoja = ss.getSheetByName("Usuarios");
      if (!hoja) return { headers: [], rows: [], error: "No se encuentra la pestaña Usuarios" };

      // --- LECTURA DE PARÁMETROS DESDE LA PESTAÑA 'Admin' ---
      var idParams = "1V2G1x_64aLUcM4M4hSTBSwI7yFNKQS4vGecLWvv_jDY"; 
      var ssParams = SpreadsheetApp.openById(idParams);
      var hojaAdmin = ssParams.getSheetByName("Admin");
      var valoresParams = hojaAdmin.getDataRange().getValues();
      
      var colorCorp = "#138275"; // Por si falla la lectura
      var colorSel  = "#1bb09e"; // Por si falla la lectura
      
      for (var p = 0; p < valoresParams.length; p++) {
        if (valoresParams[p][0] === "Color Corporativo") colorCorp = valoresParams[p][1];
        if (valoresParams[p][0] === "Color Selección")   colorSel  = valoresParams[p][1];
      }
      // -----------------------------------------------------

      var data = hoja.getDataRange().getValues();
      var headers = data[0];
      var rows = [];

      for (var i = 1; i < data.length; i++) {
        var fila = data[i].map(function(celda, index) {
          if (celda instanceof Date) {
            if (index === 5 || index === 6) {
              return Utilities.formatDate(celda, tz, "yyyy/MM/dd HH:mm:ss");
            }
            // Horas puras: HH:mm
            var hh = celda.getHours().toString().padStart(2, '0');
            var mm = celda.getMinutes().toString().padStart(2, '0');
            return hh + ":" + mm;
          }
          return celda;
        });
        rows.push(fila);
      }

      return {
        headers: headers,
        rows: rows,
        modulo: "GestionUsuarios",
        modulo_form: "GestionUsuarios_Form",
        archivo_id: id_file,
        config: {
          color_corporativo: colorCorp,
          color_seleccion: colorSel,
          botones: [
            { label: "Alta", action: "alta", class: "btn-alta" },
            { label: "Modificar", action: "modificar", class: "btn-mod" },
            { label: "Baja", action: "baja", class: "btn-baja" }
          ]
        }
      };
    } catch (e) {
      return { headers: [], rows: [], error: e.toString() };
    }
  },

  ejecutar_accion: function(metodo, params) {
    try {
      var id_file = params[0];
      var accion  = params[1];
      var data    = params[2];

      var ss = SpreadsheetApp.openById(id_file);
      var tz = ss.getSpreadsheetTimeZone();
      var hoja = ss.getSheetByName("Usuarios");
      
      var ahora = Utilities.formatDate(new Date(), tz, "yyyy/MM/dd HH:mm:ss");
      var h_ini_final = (data.restriccion === "No") ? "" : data.h_inicio;
      var h_fin_final = (data.restriccion === "No") ? "" : data.h_fin;

      if (accion === "alta") {
        hoja.appendRow([data.nombre, data.apellidos, data.mail, data.tel, data.rol, ahora, "", data.restriccion, h_ini_final, h_fin_final]);
      } 
      else if (accion === "modificar") {
        var valores = hoja.getDataRange().getValues();
        for (var i = 1; i < valores.length; i++) {
          if (valores[i][0] === data.nombre && valores[i][1] === data.apellidos) {
            hoja.getRange(i + 1, 3, 1, 3).setValues([[data.mail, data.tel, data.rol]]);
            hoja.getRange(i + 1, 8, 1, 3).setValues([[data.restriccion, h_ini_final, h_fin_final]]);
            break;
          }
        }
      } 
      else if (accion === "baja") {
        var valores = hoja.getDataRange().getValues();
        for (var i = 1; i < valores.length; i++) {
          if (valores[i][0] === data.nombre && valores[i][1] === data.apellidos) {
            hoja.getRange(i + 1, 7).setValue(ahora);
            break;
          }
        }
      }
      return { status: "ok" };
    } catch (e) {
      return { status: "error", error: e.toString() };
    }
  }
};*/