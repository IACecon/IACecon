/**
 * archivo: Auth.gs
 * Versión: v29.15 - Comparación de Roles (Respetando integridad de datos)
 */

function get_validated_user_logic() {
  try {
    var emailSession = Session.getActiveUser().getEmail().toLowerCase().trim();
    var params = get_system_params(); 
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
          // El rol se guarda tal cual está en la celda (respetando ortografía)
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
    var userData = get_validated_user_logic();
    var ss = get_master_ss(); 
    var hoja = ss.getSheetByName('Funcionalidades');
    var values = hoja.getDataRange().getValues();
    var headers = values[0].map(function(h) { return h.toString().toLowerCase().trim(); });

    var c_sb = headers.indexOf("sidebar"), c_ps = headers.indexOf("pestañas"), c_r1 = headers.indexOf("rol1"), c_r2 = headers.indexOf("rol2");

    // Pre-normalizamos el rol del usuario para la comparación interna (solo en variable)
    var rolUserComp = userData.rol.toLowerCase().trim();

    for (var i = 1; i < values.length; i++) {
      var f = values[i];
      
      // Normalizamos el valor de la celda de la DB para la comparación
      var rol1DB = f[c_r1] ? f[c_r1].toString().toLowerCase().trim() : "";
      var rol2DB = f[c_r2] ? f[c_r2].toString().toLowerCase().trim() : "";
      
      // La comparación se hace en minúsculas, pero los datos en la hoja siguen igual
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
      rol: userData.rol, // Aquí el rol viaja al front exactamente como está en la DB
      menu: menu_items
    };
  } catch (e) { return { user: "Error", menu: [], error: e.toString() }; }
}