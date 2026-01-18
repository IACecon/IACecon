/**
 * archivo: Auth.gs
 * gestiona exclusivamente la validación de usuario y construcción de menús.
 */
var id_ss_parametros = '1V2G1x_64aLUcM4M4hSTBSwI7yFNKQS4vGecLWvv_jDY';
var id_ss_usuarios = '1Eq6fvd6DXOWyp4apY8uMscSmVd-e_PsljnZKQyqArDE';

function get_validated_user_logic() {
  try {
    var correo = Session.getActiveUser().getEmail();
    var ssu = SpreadsheetApp.openById(id_ss_usuarios);
    var sh_u = ssu.getSheetByName('Usuarios');
    var data_u = sh_u.getDataRange().getValues();
    var heads = data_u[0].map(function(h) { return h.toString().toLowerCase().trim(); });
    
    var c_mail = heads.indexOf("mail"), c_rol = heads.indexOf("rol"), c_nom = heads.indexOf("nombre y apellidos");
    var info = { nombre: "invitado", rol: "sin perfil" };

    for (var i = 1; i < data_u.length; i++) {
      if (data_u[i][c_mail] && data_u[i][c_mail].toString().toLowerCase().trim() === correo.toLowerCase().trim()) {
        info.nombre = data_u[i][c_nom];
        info.rol = data_u[i][c_rol].toString().trim();
        break;
      }
    }
    
    return { 
      nombre: info.nombre, 
      rol: info.rol, 
      menu: get_dynamic_menu_logic(info.rol), 
      url_parametros: id_ss_parametros 
    };
  } catch (e) { 
    throw new Error("error auth: " + e.toString()); 
  }
}

function get_dynamic_menu_logic(rol_usuario) {
  var ssp = SpreadsheetApp.openById(id_ss_parametros);
  var data_f = ssp.getSheetByName('Funcionalidades').getDataRange().getValues();
  var heads = data_f[0].map(function(h) { return h.toString().toLowerCase().trim(); });
  
  var c_sb = heads.indexOf("sidebar"), c_ps = heads.indexOf("pestañas"), c_r1 = heads.indexOf("rol1"), c_r2 = heads.indexOf("rol2");
  var m_obj = {}, m_orden = [];

  for (var i = 1; i < data_f.length; i++) {
    var f = data_f[i];
    if (f[c_r1] === rol_usuario || f[c_r2] === rol_usuario) {
      var sb = f[c_sb] ? f[c_sb].toString().trim() : "";
      var ps = f[c_ps] ? f[c_ps].toString().trim() : "";
      if (sb !== "") {
        if (!m_obj[sb]) { m_obj[sb] = { titulo: sb, pestanas: [] }; m_orden.push(sb); }
        if (ps !== "" && m_obj[sb].pestanas.indexOf(ps) === -1) { m_obj[sb].pestanas.push(ps); }
      }
    }
  }
  return m_orden.map(function(k) { return m_obj[k]; });
}