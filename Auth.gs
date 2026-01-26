/**
 * archivo: Auth.gs
 * Versión v14 - Sincronización de Identidad y Menú
 * Fecha: 2026/01/25 23:25:00
 */

function get_validated_user_logic() {
  try {
    var emailSession = Session.getActiveUser().getEmail().toLowerCase().trim();
    var ss = SpreadsheetApp.openById(id_ss_usuarios);
    var hoja = ss.getSheetByName('Usuarios');
    var values = hoja.getDataRange().getValues();
    
    var headers = values[0].map(function(h) { return h.toString().toLowerCase().trim(); });
    var idx_email = headers.indexOf("mail") !== -1 ? headers.indexOf("mail") : 1;
    var idx_nombre = headers.indexOf("nombre") !== -1 ? headers.indexOf("nombre") : 0;
    var idx_rol = headers.indexOf("rol") !== -1 ? headers.indexOf("rol") : 2;

    for (var i = 1; i < values.length; i++) {
      var emailSheet = values[i][idx_email] ? values[i][idx_email].toString().toLowerCase().trim() : "";
      if (emailSheet === emailSession) { 
        return {
          nombre: values[i][idx_nombre] || "Usuario",
          rol: values[i][idx_rol] ? values[i][idx_rol].toString().trim() : "Invitado",
          email: emailSession,
          status: "Encontrado"
        };
      }
    }
    return { nombre: "Desconocido", rol: "Invitado", email: emailSession, status: "No encontrado" };
  } catch (e) {
    return { nombre: "Error", rol: "Invitado", email: e.toString() };
  }
}

function get_dynamic_menu_logic() {
  var menu_items = [];
  var html_files = [];
  
  try {
    var user = get_validated_user_logic();
    var rol_usuario = user.rol; 
    
    var ss = SpreadsheetApp.openById(id_ss_parametros);
    var hoja = ss.getSheetByName('Funcionalidades');
    var values = hoja.getDataRange().getValues();
    var headers = values[0].map(function(h) { return h.toString().toLowerCase().trim(); });

    // Índices de respaldo si falla el indexOf
    var c_sb   = headers.indexOf("sidebar") !== -1 ? headers.indexOf("sidebar") : 0;
    var c_ps   = (headers.indexOf("pestaña") !== -1) ? headers.indexOf("pestaña") : (headers.indexOf("pestana") !== -1 ? headers.indexOf("pestana") : 1);
    var c_r1   = headers.indexOf("rol1") !== -1 ? headers.indexOf("rol1") : 2;
    var c_r2   = headers.indexOf("rol2") !== -1 ? headers.indexOf("rol2") : 3;
    var c_html = (headers.indexOf("archivo_html") !== -1) ? headers.indexOf("archivo_html") : 6;

    for (var i = 1; i < values.length; i++) {
      var f = values[i];
      var r1 = f[c_r1] ? f[c_r1].toString().trim() : "";
      var r2 = f[c_r2] ? f[c_r2].toString().trim() : "";
      
      if (r1 === rol_usuario || r2 === rol_usuario) {
        var sidebar_name = f[c_sb] ? f[c_sb].toString().trim() : "";
        var pestaña_name = f[c_ps] ? f[c_ps].toString().trim() : "";
        var html_name    = f[c_html] ? f[c_html].toString().trim() : "";

        if (sidebar_name !== "") {
          var item = menu_items.find(function(m) { return m.sidebar === sidebar_name; });
          if (!item) {
            item = { sidebar: sidebar_name, nombre: sidebar_name, titulo: sidebar_name, pestañas: [], pestanas: [] };
            menu_items.push(item);
          }
          if (pestaña_name !== "") {
            item.pestañas.push(pestaña_name);
            item.pestanas.push(pestaña_name);
          }
        }

        if (html_name !== "" && html_files.indexOf(html_name) === -1) {
          html_files.push(html_name);
        }
      }
    }
    
    return {
      nombre: user.nombre,
      rol: user.rol,
      email: user.email,
      menu: menu_items,
      html_files: html_files,
      status: user.status
    };
    
  } catch (e) {
    return { nombre: "Error", rol: "Invitado", menu: [], html_files: [] };
  }
}