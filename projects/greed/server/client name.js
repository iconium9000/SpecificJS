// client name

module.exports = function client_name(cl,client_id,{name}) {
  cl.names[client_id] = name
  cl.update()
}
