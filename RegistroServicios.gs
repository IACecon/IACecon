/**
 * archivo: RegistroServicios.gs
 */
/*var RegistroServicios = {

  obtener_interfaz: function(id_file_op, ps_op) {
    try {
      var ss_op = SpreadsheetApp.openById(id_file_op);
      var tz = ss_op.getSpreadsheetTimeZone();
      var hoja_op = ss_op.getSheetByName(ps_op);
      if (!hoja_op) return { headers: [], rows: [], error: "No existe la pestaña" };

      var data_op = hoja_op.getDataRange().getValues();
      var headers = ["VIGILANTE", "ESTADO ACTUAL", "ÚLTIMA FECHA/HORA", "OBSERVACIONES"];
      */
      /*if (data_op.length <= 1) {
        return { headers: headers, rows: [], modulo_form: "RegistroServicios_Form" };
      }*/
/*
      var mapaUltimos = {};
      
      // Recorremos la hoja (A:Timestamp, B:Vigilante, C:Acción, D:Notas)
      for (var i = 1; i < data_op.length; i++) {
        var nombre = data_op[i][1]; // Columna B
        if (!nombre) continue;

        var fechaRaw = data_op[i][0];
        var fechaFormateada = (fechaRaw instanceof Date) 
          ? Utilities.formatDate(fechaRaw, tz, "yyyy/MM/dd HH:mm:ss") 
          : fechaRaw.toString();

        mapaUltimos[nombre] = {
          estado: data_op[i][2] || "SIN REGISTRO",
          fecha: fechaFormateada,
          notas: data_op[i][3] || ""
        };
      }

      // Convertir el mapa en filas para la interfaz
      var rows = Object.keys(mapaUltimos).sort().map(function(vig) {
        return [
          vig,
          mapaUltimos[vig].estado,
          mapaUltimos[vig].fecha,
          mapaUltimos[vig].notas
        ];
      });

      return {
        headers: headers,
        rows: rows,
        modulo_form: "RegistroServicios_Form",
        config: { color_header: "#138275", btn_nuevo: false, btn_editar: false },
        archivo_id: id_file_op
      };

    } catch (e) {
      return { headers: [], rows: [], error: e.toString() };
    }
  },

  ejecutar_accion: function(metodo, params) {
    if (metodo === "registrar_fichaje") {
      return this.set_registro(params);
    }
    return "Error: Método no reconocido";
  },

  set_registro: function(params) {
    try {
      var ss = SpreadsheetApp.openById(params.archivo_id);
      var hoja = ss.getSheetByName("Servicios");
      var ahora = Utilities.formatDate(new Date(), "GMT+1", "yyyy/MM/dd HH:mm:ss");
      
      hoja.appendRow([
        ahora,
        params.nombre,
        params.tipo_registro,
        params.observaciones || ""
      ]);
      
      return { status: "ok" };
    } catch (e) {
      return { status: "error", mensaje: e.toString() };
    }
  }
};*/