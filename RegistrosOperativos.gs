/**
 * proyecto ia cecon
 * archivo: RegistrosOperativos.gs
 */
var RegistrosOperativos = (function() {
  
  function listar(idarchivo, nombrepestana) {
    try {
      if (!idarchivo) throw new Error("falta id del archivo de datos");
      
      var ss = SpreadsheetApp.openById(idarchivo);
      var sheet = ss.getSheetByName(nombrepestana) || ss.getSheets()[0];
      var values = sheet.getDataRange().getValues();
      
      if (values.length === 0) return { headers: [], rows: [], config: { botones: [] } };
      
      var headers = values[0].map(function(h) { return h.toString(); });
      
      var rows = values.slice(1).map(function(row) {
        return row.map(function(cell) {
          if (cell instanceof Date) return Utilities.formatDate(cell, "GMT+1", "yyyy/mm/dd hh:mm:ss");
          return cell ? cell.toString() : "";
        });
      });
      
      return {
        headers: headers,
        rows: rows,
        config: {
          placeholderbusqueda: "buscar en " + nombrepestana + "...",
          botones: [
            { label: "nuevo registro", class: "btn-alta", action: "nuevo" },
            { label: "modificar", class: "btn-mod", action: "editar" }
          ]
        }
      };
    } catch(e) { 
      return { error: "error en registrosoperativos: " + e.toString(), config: { botones: [] } }; 
    }
  }

  return { listar: listar };
})();