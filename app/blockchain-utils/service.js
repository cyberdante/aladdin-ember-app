import Service from '@ember/service';
import mocks from './mocks';

export default Service.extend({

  generateSchema: function() {
    return mocks.schema;
  },

  generateGraph: function() {
    return mocks.graphvz;
  },

  generateContract: function() {
    return mocks.contract;
  }

});


/*
import Service from '@ember/service';
const fs = require('fs');
const yaml = require('js-yaml');
const dagreD3 = require('dagre-d3');
const  dot = require("graphlib-dot");

export default Service.extend({

    //*************************************************
    // Inputs: schemaInterface- An ABI definition object 
    //        corresponding to the given JSON text
    //
    //        title- Title given to the JSON schema  
    // Returns: A JSON string representing the schema
    // Description:  The ABI object passed in syntactic 
    //        components are iterated through building 
    //        the JSON schema. NOTE: within the JSON 
    //        schema the keyword \textit{dependencies} 
    //        signifies an asset relationship
    //*************************************************
    generateSchema(schemaInterface, title){
        let schema = {}; 
        schema.$schema = "http://json-schema.org/draft-04/schema"; 
        schema.title = title; 
        schema.description = "Smart Contract Form for the demo" 
        schema.type = typeof(schema);
        schema.properties = {};
          
        schemaInterface.forEach(func =>{
          if(func.type != 'constructor'){  
          let fn = {};      
          fn.title;
          fn.type = typeof(fn);
          fn.properties = {};
          let assetName;
          let isAsset = false;
              
            for (var key in func){
                let asset = {};
                if(key =="name") fn.title = func[key];
                if(key == "inputs"){
                    for(var ikey in func[key]){
                      if(isAsset == true){
                          isAsset = false;
                          assetName = (func[key][ikey]);
                          asset.type = assetName.name;
                          break;
                      }
                      if(func[key][ikey].name == "assetId"){
                        fn.properties.dependencies = {}
                        fn.properties.dependencies[func[key][ikey].name] = func[key][ikey];
                        asset = fn.properties.dependencies[func[key][ikey].name]
                        isAsset = true;
                       }
                       else{
                        fn.properties[func[key][ikey].name] = func[key][ikey];
                        if(func[key][ikey].type.startsWith("byte")) func[key][ikey].type = "string";
                        if(func[key][ikey].type.startsWith("uint")||func[key][ikey].type.startsWith("uint") ) func[key][ikey].type = "number";
                       }
                      }            
                }
                //Do we need returns?
                if(key == 'outputs'){
                    if( func[key].length < 1){
                      dummyReturn = {}
                      fn.properties.returns= dummyReturn;
                  }
                  for(var ikey in func[key]){
                      fn.properties.returns =func[key][ikey];
                      if(fn.properties.returns.type.startsWith("byte")) func[key][ikey].type = "string";
                      if(fn.properties.returns.type.startsWith("uint") ) func[key][ikey].type = "number";
                  }
              }
            }
            schema.properties[fn.title] = fn;
            }
        });
        
        let jsonSchema = JSON.stringify(schema).replace(/[\[\]']+/g,'');
        return jsonSchema;
      },

      generateSchemaYaml(title){
        let schema = {}; 
        schema.$schema = "http://json-schema.org/draft-04/schema"; 
        schema.title = title; 
        schema.description = "Smart Contract Form for the demo" 
        schema.type = typeof(schema);
        schema.properties = {};
          
        const config = yaml.safeLoad(fs.readFileSync('test.yml', 'utf8'));
    
        config.forEach(func =>{
            if(Object.keys(func)!='asset'){
              for (var key in func){
                  for(var ikey in func[key]){
                      if (typeof func[key][ikey].properties != 'undefined')
                      schema.properties[func[key][ikey].title] = func[key][ikey].properties
                      Object.keys(func[key][ikey]).forEach(function(pkey){
                        if (pkey == 'title'){
                            schema.properties[func[key][ikey].title].title = func[key][ikey].title;
                        }
                       });
                  }
              }
            }
          });
        let jsonSchema = JSON.stringify(schema).replace(/[\[\]']+/g,'');
        return jsonSchema;
    
    },
    generateGraph(schemaString){
   
        var schema = JSON.parse(schemaString);
        //Graph styles 
        var nodeAsset = {};
        nodeAsset.color = 'slategray3';
        nodeAsset.shape = 'diamond';
        nodeAsset.style = 'filled';
        
        var nodeTransaction = {};
        nodeTransaction.style = 'filled';
        nodeTransaction.color = 'grey92';
        
        var edge= {};
        edge.color = 'snow3';
        edge.style = 'filled';
        
        var g = new dagreD3.graphlib.Graph({compound:true})
        .setGraph({})
        .setDefaultEdgeLabel(function() { return {}; }); 
        
        Object.keys(schema).forEach(function(key) {
            for(var ikey in schema[key]){
                if(schema[key][ikey].type == 'object' ){
                    if(schema[key][ikey].properties.dependencies){
                        g.setEdge(schema[key][ikey].title, schema[key][ikey].properties.dependencies.assetId.type, {style: edge.style, fillcolor: edge.color});
                        g.setNode(schema[key][ikey].properties.dependencies.assetId.type, {asset: 'true', shape: nodeAsset.shape, style: nodeAsset.style, fillcolor: nodeAsset.color});
                    }
            }
           }
        });
        
        g.nodes().forEach(function(v) {
            let x = JSON.stringify(g.node(v));
            if(x==undefined)
             g.setNode(v, { style: nodeTransaction.style, fillcolor: nodeTransaction.color});
        });
        fs.appendFileSync("nodes.gv", dot.write(g));
    },
    
    generateGraphYaml(schemaString){
       
        var schema = JSON.parse(schemaString);
        
        var nodeAsset = {};
        nodeAsset.color = 'slategray3';
        nodeAsset.shape = 'diamond';
        nodeAsset.style = 'filled';
        
        var nodeTransaction = {};
        nodeTransaction.style = 'filled';
        nodeTransaction.color = 'grey92';
        
        var edge= {};
        edge.color = 'snow3';
        edge.style = 'filled';
        
        var g = new dagreD3.graphlib.Graph({compound:true})
        .setGraph({})
        .setDefaultEdgeLabel(function() { return {}; }); 
        
    
        Object.keys(schema).forEach(function(key) {
            for(var ikey in schema[key]){
                Object.keys(schema[key][ikey]).forEach(function(pkey){
                    if(pkey=='dependencies'){
                        g.setEdge(schema[key][ikey].title, schema[key][ikey][pkey].type, {style: edge.style, fillcolor: edge.color});
                        g.setNode(schema[key][ikey][pkey].type, {asset: 'true', shape: nodeAsset.shape, style: nodeAsset.style, fillcolor: nodeAasset.color});
                    }
                });
           }
        });
        
        g.nodes().forEach(function(v) {
            let x = JSON.stringify(g.node(v));
            if(x==undefined)
             g.setNode(v, { style: nodeTransaction.style, fillcolor: nodeTransaction.color});
        });
        fs.appendFileSync("nodes.gv", dot.write(g));
    },
    
    generateSolFile(schemaString){
        var schema = JSON.parse(schemaString);
        fs.appendFileSync(schema.title + '.so', 'pragma solidity ^0.4.18; contract ' + schema.title + '{');
        Object.keys(schema).forEach(function(key) {
            for(var ikey in schema[key]){
                if(schema[key][ikey].type == 'object' ){
                    fs.appendFileSync(schema.title + '.so', 'function '  + schema[key][ikey].title + ' (' );
                    Object.keys(schema[key][ikey].properties).forEach(function(inkey,index) {
                        if(inkey == "dependencies"){
                            fs.appendFileSync(schema.title + '.so','bytes32 ' + schema[key][ikey].properties[inkey].assetId.name + ", bytes32  " + schema[key][ikey].properties[inkey].assetId.type +' )'); 
                        }
                        else if (inkey =='returns'){
                            if((schema[key][ikey].properties[inkey].type)!=undefined) {
                                if (schema[key][ikey].properties[inkey].type == 'number')
                                schema[key][ikey].properties[inkey].type = 'uint'
                                if (schema[key][ikey].properties[inkey].type == 'string')
                                schema[key][ikey].properties[inkey].type = 'bytes32'
                                fs.appendFileSync(schema.title + '.so', 'public constant returns(' + schema[key][ikey].properties[inkey].type+ '){}');
                            }
                            else
                            fs.appendFileSync(schema.title + '.so', 'public{}');
                        }
                        else{
                            if (schema[key][ikey].properties[inkey].type == 'number')
                            schema[key][ikey].properties[inkey].type = 'uint'
                            if (schema[key][ikey].properties[inkey].type == 'string')
                            schema[key][ikey].properties[inkey].type = 'bytes32'
                            fs.appendFileSync(schema.title + '.so', schema[key][ikey].properties[inkey].type + " "); 
                            fs.appendFileSync(schema.title + '.so', schema[key][ikey].properties[inkey].name + ", ");
                        }
    
                    });
                }
            }
        });
        fs.appendFileSync(schema.title + '.so', '}');
    },
    
    generateSolFileYaml (schemaString){
        var schema = JSON.parse(schemaString);
        fs.appendFileSync(schema.title + '.so', 'pragma solidity ^0.4.18; contract ' + schema.title + '{');
        Object.keys(schema).forEach(function(key) {
            for(var ikey in schema[key]){
                if(typeof schema[key][ikey] ==  'object' ){
                    fs.appendFileSync(schema.title + '.so', 'function '  + schema[key][ikey].title + ' (' );
                    Object.keys(schema[key][ikey]).forEach(function(inkey) {
                        console.log(schema[key][ikey][inkey])
                        if(inkey == "dependencies"){
                           fs.appendFileSync(schema.title + '.so','bytes32 ' + schema[key][ikey][inkey].name + ", bytes32  " + schema[key][ikey][inkey].type +' ) public{} '); 
                        }
                        // else if (inkey =='returns'){
                        //     if((schema[key][ikey][inkey].type)!=undefined) {
                        //         if (schema[key][ikey][inkey].type == 'number')
                        //         schema[key][ikey][inkey].type = 'uint'
                        //         if (schema[key][ikey][inkey].type == 'string')
                        //         schema[key][ikey][inkey].type = 'bytes32'
                        //         fs.appendFileSync(schema.title + '.so', 'public constant returns(' + schema[key][ikey][inkey].type + '){}');
                        //     }
                        //     else
                        //     fs.appendFileSync(schema.title + '.so', 'public{}');
                        // }
                        else{
                            if(inkey != 'title'){
                            if (schema[key][ikey][inkey].type == 'number')
                            schema[key][ikey][inkey].type = 'uint'; 
                            if (schema[key][ikey][inkey].type == 'string')
                            schema[key][ikey][inkey].type = 'bytes32'
                            fs.appendFileSync(schema.title + '.so', schema[key][ikey][inkey].type + " "); 
                            fs.appendFileSync(schema.title + '.so', schema[key][ikey][inkey].name + ", ");
                        }
                        }
    
                    });
                }
            }
        });
        fs.appendFileSync(schema.title + '.so', '}');
    }

});
*/