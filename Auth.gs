/**
 * archivo: Auth.gs
 * Versión: v30.22 - Limpieza de lógica de menús
 */

function get_validated_user_logic(params) {
  try {
    var emailSession = Session.getActiveUser().getEmail().toLowerCase().trim();
    var urlUsuarios = params["Usuarios"] || "";
    var match = urlUsuarios.match(/[-\w]{25,}/);
    if (!match) return { user: "Error Config", rol: "Invitado", email: emailSession };
    
    var ss = SpreadsheetApp.openById(match[0]);
    var hoja = ss.getSheetByName('Usuarios');
    var values = hoja.getDataRange().getValues();
    var headers = values[0].map(function(h) { return h.toString().toLowerCase().trim(); });
    var idx_email = headers.indexOf("mail"), idx_nombre = headers.indexOf("nombre"), idx_rol = headers.indexOf("rol");
    
    for (var i = 1; i < values.length; i++) {
      var mail_db = values[i][idx_email] ? values[i][idx_email].toString().toLowerCase().trim() : "";
      if (mail_db === emailSession) { 
        return {
          user: values[i][idx_nombre] || "Usuario", 
          rol: values[i][idx_rol] ? values[i][idx_rol].toString().trim() : "Invitado",
          email: emailSession
        };
      }
    }
    return { user: "Desconocido", rol: "Invitado", email: emailSession };
  } catch (e) { return { user: "Error", rol: "Invitado", error: e.toString() }; }
}

function get_dynamic_menu_logic() {
  var menu_items = [];
  try {
    var params = get_system_params(); 
    var userData = get_validated_user_logic(params);

    // Lógica de registro movida a Main.gs para evitar duplicidad

    var ss = get_master_ss(); 
    var hoja = ss.getSheetByName('Funcionalidades');
    var values = hoja.getDataRange().getValues();
    var headers = values[0].map(function(h) { return h.toString().toLowerCase().trim(); });
    var c_sb = headers.indexOf("sidebar"), c_ps = headers.indexOf("pestañas"), c_r1 = headers.indexOf("rol1"), c_r2 = headers.indexOf("rol2");
    
    var rolUserComp = userData.rol.toLowerCase().trim();
    
    for (var i = 1; i < values.length; i++) {
      var f = values[i];
      var rol1DB = f[c_r1] ? f[c_r1].toString().toLowerCase().trim() : "";
      var rol2DB = f[c_r2] ? f[c_r2].toString().toLowerCase().trim() : "";
      
      if (rol1DB === rolUserComp || rol2DB === rolUserComp || rol1DB === "todos") {
        var sidebar_name = f[c_sb] ? f[c_sb].toString().trim() : "";
        if (sidebar_name !== "") {
          var item = null;
          for (var m = 0; m < menu_items.length; m++) {
            if (menu_items[m].sidebar === sidebar_name) { item = menu_items[m]; break; }
          }
          if (!item) {
            item = { sidebar: sidebar_name, titulo: sidebar_name, pestanas: [] };
            menu_items.push(item);
          }
          var pestaña_val = (c_ps !== -1 && f[c_ps]) ? f[c_ps].toString().trim() : "";
          if (pestaña_val !== "") item.pestanas.push(pestaña_val);
        }
      }
    }
    
    return { 
      user: userData.user, 
      nombre: userData.user,
      rol: userData.rol,
      menu: menu_items,
      mail: userData.email
    };
  } catch (e) { return { user: "Error", menu: [], error: e.toString() }; }
}

function registrar_evento_sesion(email, accion, params) {
  try {
    var urlSesiones = params["Sesiones"] || "";
    var match = urlSesiones.match(/[-\w]{25,}/);
    if (!match) return;

    var ss = SpreadsheetApp.openById(match[0]);
    var hoja = ss.getSheetByName('Sesiones') || ss.getSheets()[0];
    
    var fechaActual = Utilities.formatDate(new Date(), "GMT+1", "yyyy/MM/dd HH:mm:ss");
    hoja.appendRow([fechaActual, email, accion]);
    
  } catch (e) {
    if (typeof registrar_log === "function") {
      registrar_log("Error registro sesión: " + e.toString(), "Auth");
    }
  }
}