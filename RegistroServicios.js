/**
 * archivo: RegistroServicios.gs
 * lógica operativa para el registro de inicio y fin de servicio.
 */
var RegistroServicios = (function() {
  // origen de datos para el personal (según parámetros del sistema)
  var id_ss_usuarios = '1Eq6fvd6DXOWyp4apY8uMscSmVd-e_PsljnZKQyqArDE';

  /**
   * punto de entrada invocado por Main.gs
   * @param {string} id_ss - ID de la base de datos operativa (columna E de Funcionalidades)
   */
  function obtener_interfaz(id_ss) {
    try {
      var staff = get_staff_list();
      return {
        tipo: "especial_servicios",
        staff: staff,
        archivo_id: id_ss
      };
    } catch(e) { 
      return { status: "error", message: e.toString() }; 
    }
  }

  /**
   * obtiene la lista de vigilantes y jefes de equipo
   */
  function get_staff_list() {
    var ssu = SpreadsheetApp.openById(id_ss_usuarios);
    var sh = ssu.getSheetByName('Usuarios');
    var data = sh.getDataRange().getValues();
    var heads = data[0].map(function(h) { return h.toString().toLowerCase().trim(); });
    
    var c_nom = heads.indexOf("nombre y apellidos");
    var c_mail = heads.indexOf("mail");
    var c_rol = heads.indexOf("rol");
    
    var lista = [];
    for (var i = 1; i < data.length; i++) {
      var rol = data[i][c_rol] ? data[i][c_rol].toString().trim() : "";
      if (rol === "Vigilante" || rol === "Jefe de Equipo") {
        lista.push({ 
          nombre: data[i][c_nom], 
          mail: data[i][c_mail] 
        });
      }
    }
    return lista;
  }

  /**
   * verifica si el usuario seleccionado ya está en servicio o no
   */
  function obtener_estado_vigilante(id_ss, mail) {
    try {
      var ssu = SpreadsheetApp.openById(id_ss_usuarios);
      var du = ssu.getSheetByName('Usuarios').getDataRange().getValues();
      var nombre = "";
      // obtener el nombre real a partir del mail
      for (var i = 1; i < du.length; i++) {
        if (du[i][1] === mail) { nombre = du[i][0]; break; }
      }

      var ss = SpreadsheetApp.openById(id_ss);
      var sheet = ss.getSheetByName('Servicios');
      if (!sheet) return { activo: false, nombre: nombre };
      
      var data = sheet.getDataRange().getValues();
      var activo = false;
      // buscar la última entrada de este vigilante
      for (var j = data.length - 1; j > 0; j--) {
        if (data[j][1] === nombre) {
          if (data[j][2] === "Inicio") activo = true;
          break;
        }
      }
      return { activo: activo, nombre: nombre };
    } catch(e) { return { error: e.toString() }; }
  }

  /**
   * registra la entrada o salida en la base de datos operativa
   */
  function registrar(id_ss, accion, notas, mail) {
    try {
      var ssu = SpreadsheetApp.openById(id_ss_usuarios);
      var du = ssu.getSheetByName('Usuarios').getDataRange().getValues();
      var nombre = "usuario";
      for (var i = 1; i < du.length; i++) {
        if (du[i][1] === mail) { nombre = du[i][0]; break; }
      }

      var ss = SpreadsheetApp.openById(id_ss);
      var sheet = ss.getSheetByName('Servicios') || ss.insertSheet('Servicios');
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Timestamp", "Vigilante", "Acción", "Notas"]);
      }

      var now = Utilities.formatDate(new Date(), "GMT+1", "yyyy/MM/dd HH:mm:ss");
      var txt_acc = (accion === "inicio") ? "Inicio" : "Fin";
      var row = [now, nombre, txt_acc, notas];
      sheet.appendRow(row);

      // trazabilidad radical requerida
      console.log("url: " + ss.getUrl());
      console.log("pestaña: Servicios");
      console.log("campos: Timestamp | Vigilante | Acción | Notas");
      console.log("valores: " + row.join(" | "));

      return { status: "ok", nombre: nombre, accion: txt_acc };
    } catch(e) { return { status: "error", message: e.toString() }; }
  }

  return {
    obtener_interfaz: obtener_interfaz,
    registrar: registrar,
    obtener_estado_vigilante: obtener_estado_vigilante
  };
})();

/**
 * funciones de enrutamiento para comunicación con Scripts.html a través de Main.gs
 */
function obtener_estado_vigilante_router(id, mail) { 
  return RegistroServicios.obtener_estado_vigilante(id, mail); 
}

function registrar_servicio_router(id, acc, notas, mail) { 
  return RegistroServicios.registrar(id, acc, notas, mail); 
}