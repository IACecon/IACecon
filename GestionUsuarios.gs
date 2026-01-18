/**
 * archivo: GestionUsuarios.gs bokana
 */

function api_usuarios_get_interfaz(id_ss) {
  try {
    if (!id_ss) return null;
    var ss = SpreadsheetApp.openById(id_ss);
    var hoja = ss.getSheets()[0];
    var data = hoja.getDataRange().getValues();
    
    var cleanData = data.map(function(row) {
      return row.map(function(cell) {
        if (cell instanceof Date) {
          return Utilities.formatDate(cell, "GMT+1", "yyyy/MM/dd HH:mm:ss");
        }
        return cell;
      });
    });

    return {
      headers: cleanData[0] || [],
      rows: cleanData.length > 1 ? cleanData.slice(1) : [],
      modulo_form: "GestionUsuarios_Form",
      archivo_id: id_ss,
      modulo: "GestionUsuarios",
      config: {
        buscador: true,
        botones: [
          { label: "Alta", class: "btn-alta", action: "ejecutar_accion_GestionUsuarios('alta')" },
          { label: "Baja", class: "btn-baja", action: "ejecutar_accion_GestionUsuarios('baja')" },
          { label: "Modificar", class: "btn-mod", action: "ejecutar_accion_GestionUsuarios('modificar')" }
        ]
      }
    };
  } catch(e) {
    return { status: "error", msg: e.toString() };
  }
}

function api_usuarios_ejecutar_accion(id_ss, accion, data) {
  try {
    var ss = SpreadsheetApp.openById(id_ss);
    var hoja = ss.getSheets()[0];
    var valores = hoja.getDataRange().getValues();
    var ahora = Utilities.formatDate(new Date(), "GMT+1", "yyyy/MM/dd HH:mm:ss");

    if (accion === "alta") {
      hoja.appendRow([data.nombre, data.mail, data.tel, data.rol, ahora, "", data.restriccion, data.h_inicio, data.h_fin]);
    } else if (accion === "modificar" || accion === "baja") {
      for (var i = 1; i < valores.length; i++) {
        if (valores[i][0] === data.nombre) {
          if (accion === "modificar") {
            hoja.getRange(i + 1, 2, 1, 3).setValues([[data.mail, data.tel, data.rol]]);
            hoja.getRange(i + 1, 7, 1, 3).setValues([[data.restriccion, data.h_inicio, data.h_fin]]);
          } else {
            hoja.getRange(i + 1, 6).setValue(ahora);
          }
          break;
        }
      }
    }
    return { status: "ok" };
  } catch(e) { return { status: "error", error: e.toString() }; }
}