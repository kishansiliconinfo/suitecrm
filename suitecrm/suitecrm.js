module.exports = function(RED) {
    function SuitecrmFind(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        
        var globalContext = this.context().global;
	    var app = globalContext.app;
	    
        var sugar = require('node-sugarcrm-client');
        
        var model = config.model;
        
        sugar.init(
			{
				apiURL:  "http://exemple.rafagaming.com/service/v4_1/rest.php"
			   ,login:   "admin"
			   ,passwd:  "123456"
			}
		);
		
		//console.log('============Login==========');
		sugar.login(function(sessionID){
			if (sessionID != 'undefined') {

				// If you are here, you got a session ID
				// and you can add all your query here
				
				// console.log('Your session ID is', sessionID);
				
				modelparams = {
					 session:  sessionID
					,filter : "default"
				};
				
				// model list
				RED.httpAdmin.get("/CRMModels", function(req,res) {
					sugar.call("get_available_modules", modelparams, function(data,err){
						if (err) {
							res.json(err);
						}
						else {
							res.json(data);
							//console.log(data)
						}
					});
				});
				
				modelfieldsparams = {
						 session:  sessionID
						,module_name : model
						,fields: []
				};
				
				// console.log("=====modelfieldsparams=====");
				// console.log(modelfieldsparams);
			
				node.on('input', function(msg) {
					sugar.call("get_module_fields", modelfieldsparams, function(res,err){
						if (err) {
							//console.log(err)
							node.status({color: 'red', text: err});
							node.send([null, msg]);
						}
						else {
							//console.log(res)
							msg.payload = res;
							node.send([msg, null]);
							return res;
						}
					})
				});
				
				
				//Model fields
				RED.httpAdmin.get("/CRMModelsFields/:model", function(req,res) {
					
					modelfieldsparams = {
						 session:  sessionID
						,module_name: req.params.model
						,fields: []
					};
				
					// console.log("=====modelfieldsparams=====");
					// console.log(modelfieldsparams);
				
					sugar.call("get_module_fields", modelfieldsparams, function(data,err){
						if (err) {
							res.json(err);
						}
						else {
							res.json(data);
						}
					});
				});
				
				//Relation list
				RED.httpAdmin.get("/CRMModelsRelations/:model", function(req,res) {
					
					relationparams = {
						session:  sessionID
						,module_name: req.params.model
						,related_fields: []
					};	
					
					sugar.call("get_relationships", relationparams, function(data,err){
						if (err) {
							res.json(err);
						}
						else {
							res.json(data);
							//console.log(data)
						}
					});
				});
				
				
				//Common testing other API list
				RED.httpAdmin.get("/common/:model", function(req,res) {
					
					common = {
						session:  sessionID
						,module_name: req.params.model
						,query: ''
						,order_by : ''
						,offset : 0
						,select_fields: ['id']
						,link_name_to_fields_array: [['name']]
						,max_results: 100
						,deleted: 0
						,favorites: false
					};	
					
					sugar.call("get_entry_list", common, function(data,err){
						if (err) {
							res.json(err);
							//console.log(err)
						}
						else {
							res.json(data);
							//console.log(data)
						}
					});
				});
				
			} else {
				//console.log("can't login, check your credentials");
			}
		});
    }
    RED.nodes.registerType("suitecrm",SuitecrmFind);

    RED.httpAdmin.get("/getModelFields/:model", function(req,res) {
        res.json(Object.keys(RED.settings.functionGlobalContext.app.models[req.params.model].attributes));
    });
    
    RED.httpAdmin.get("/getModelRelational/:model", function(req,res) {
        res.json(Object.keys(RED.settings.functionGlobalContext.app.models[req.params.model].associations));
    });

}
