import Service from '@ember/service';
import {
    A
} from '@ember/array';
import O from '@ember/object';
// import mocks from './mocks';

import yaml from 'js-yaml';
import dagreD3 from 'dagre-d3';
import dot from 'graphlib-dot';
// import solc from 'solc';
// import YAML from 'json2yaml';


export default Service.extend({
    // *************************************************
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
    // *************************************************
    generateSchema(schemaInterface, title) {
        let schema = {};
        schema.$schema = "http://json-schema.org/draft-04/schema";
        schema.title = title;
        schema.description = "Smart Contract Form for the demo"
        schema.type = typeof (schema);
        schema.properties = {};

        schemaInterface.forEach(func => {
            if (func.type != 'constructor') {
                let fn = {};
                fn.title;
                fn.type = typeof (fn);
                fn.properties = {};
                let assetName;
                // let dummyReturn = {}; // unused variable
                let isAsset = false;

                for (let key in func) {
                    let asset = {};
                    if (key == "name") fn.title = func[key];
                    if (key == "inputs") {
                        for (let ikey in func[key]) {
                            if (isAsset == true) {
                                isAsset = false;
                                assetName = (func[key][ikey]);
                                asset.type = assetName.name;
                                break;
                            }
                            if (func[key][ikey].name == "assetId") {
                                fn.properties.dependencies = {}
                                fn.properties.dependencies[func[key][ikey].name] = func[key][ikey];
                                asset = fn.properties.dependencies[func[key][ikey].name]
                                isAsset = true;
                            } else {
                                fn.properties[func[key][ikey].name] = func[key][ikey];
                                if (func[key][ikey].type.startsWith("byte")) func[key][ikey].type = "string";
                                if (func[key][ikey].type.startsWith("uint") || func[key][ikey].type.startsWith("uint")) func[key][ikey].type = "number";
                            }
                        }
                    }
                    schema.properties[fn.title] = fn;
                }
            }
        });

        let jsonSchema = JSON.stringify(schema).replace(/[[\]']+/g, '');
        return jsonSchema;
    },

    generateSchemaYaml(yamlString, title) {
        let schema = {};
        schema.$schema = "http://json-schema.org/draft-04/schema";
        schema.title = title;
        schema.description = "Smart Contract Form for the demo"
        schema.type = typeof (schema);
        schema.properties = {};

        const config = yaml.safeLoad(yamlString);

        config.forEach(func => {
            if (Object.keys(func) != 'asset') {
                for (let key in func) {
                    for (let ikey in func[key]) {
                        if (typeof func[key][ikey].properties != 'undefined')
                            schema.properties[func[key][ikey].title] = func[key][ikey].properties
                        Object.keys(func[key][ikey]).forEach(function (pkey) {
                            if (pkey == 'title') {
                                schema.properties[func[key][ikey].title].title = func[key][ikey].title;
                            }
                        });
                    }
                }
            }
        });
        let jsonSchema = JSON.stringify(schema).replace(/[[\]']+/g, '');
        return jsonSchema;
    },

    generateGraph(schemaString) {
        let schema = JSON.parse(schemaString);
        //Graph styles 
        let nodeAsset = {};
        nodeAsset.color = 'slategray3';
        nodeAsset.shape = 'diamond';
        nodeAsset.style = 'filled';

        let nodeTransaction = {};
        nodeTransaction.style = 'filled';
        nodeTransaction.color = 'grey92';

        let edge = {};
        edge.color = 'snow3';
        edge.style = 'filled';

        let g = new dagreD3.graphlib.Graph({
                compound: true
            })
            .setGraph({})
            .setDefaultEdgeLabel(function () {
                return {};
            });

        Object.keys(schema).forEach(function (key) {
            for (let ikey in schema[key]) {
                if (schema[key][ikey].type == 'object') {
                    if (schema[key][ikey].properties.dependencies) {
                        g.setEdge(schema[key][ikey].title, schema[key][ikey].properties.dependencies.assetId.type, {
                            style: edge.style,
                            fillcolor: edge.color
                        });
                        g.setNode(schema[key][ikey].properties.dependencies.assetId.type, {
                            asset: 'true',
                            shape: nodeAsset.shape,
                            style: nodeAsset.style,
                            fillcolor: nodeAsset.color
                        });
                    }
                }
            }
        });

        g.nodes().forEach(function (v) {
            let x = JSON.stringify(g.node(v));
            if (x == undefined) {
                g.setNode(v, {
                    style: nodeTransaction.style,
                    fillcolor: nodeTransaction.color
                });
            }
        });
        return dot.write(g);
    },

    generateGraphYaml(schemaString) {
        let schema = JSON.parse(schemaString);
        let nodeAsset = {};
        nodeAsset.color = 'slategray3';
        nodeAsset.shape = 'diamond';
        nodeAsset.style = 'filled';

        let nodeTransaction = {};
        nodeTransaction.style = 'filled';
        nodeTransaction.color = 'grey92';

        let edge = {};
        edge.color = 'snow3';
        edge.style = 'filled';

        let g = new dagreD3.graphlib.Graph({
                compound: true
            })
            .setGraph({})
            .setDefaultEdgeLabel(function () {
                return {};
            });

        Object.keys(schema).forEach(function (key) {
            for (let ikey in schema[key]) {
                Object.keys(schema[key][ikey]).forEach(function (pkey) {
                    if (pkey == 'dependencies') {
                        g.setEdge(schema[key][ikey].title, schema[key][ikey][pkey].type, {
                            style: edge.style,
                            fillcolor: edge.color
                        });
                        g.setNode(schema[key][ikey][pkey].type, {
                            asset: 'true',
                            shape: nodeAsset.shape,
                            style: nodeAsset.style,
                            fillcolor: nodeAsset.color
                        });
                    }
                });
            }
        });

        g.nodes().forEach(function (v) {
            let x = JSON.stringify(g.node(v));
            if (x == undefined) {
                g.setNode(v, {
                    style: nodeTransaction.style,
                    fillcolor: nodeTransaction.color
                });
            }
        });

        return dot.write(g);
    },

    generateContract(schemaString) {
        String.prototype.appendLine = function (s) {
            return `${this}\n${s}`
        };
        let schema = JSON.parse(schemaString);
        let sol = 'pragma solidity ^0.4.18;';
        sol = sol.appendLine('');
        sol = sol.appendLine('contract ' + schema.title + '{');
        Object.keys(schema).forEach(function(key) {
            for (let ikey in schema[key]) {
                if (schema[key][ikey].type == 'object' ) {
                    sol = sol.appendLine('');
                    sol = sol.appendLine( 'function '  + schema[key][ikey].title + ' (' );
                    Object.keys(schema[key][ikey].properties).forEach(function (inkey) {
                        if (inkey == "dependencies") {
                            sol = sol.appendLine('bytes32 ' + schema[key][ikey].properties[inkey].assetId.name + ',');
                            sol = sol.appendLine('bytes32 ' + schema[key][ikey].properties[inkey].assetId.type + ')');
                        } else if (inkey == 'returns') {
                            if ((schema[key][ikey].properties[inkey].type) != undefined) {
                                if (schema[key][ikey].properties[inkey].type == 'number') {
                                    schema[key][ikey].properties[inkey].type = 'uint'
                                }
                                if (schema[key][ikey].properties[inkey].type == 'string') {
                                    schema[key][ikey].properties[inkey].type = 'bytes32'
                                }
                                sol = sol.appendLine('public constant returns(' + schema[key][ikey].properties[inkey].type + '){}');
                            } else {
                                sol = sol.appendLine('public{}');
                            }
                        } else {
                            if (schema[key][ikey].properties[inkey].type == 'number') {
                                schema[key][ikey].properties[inkey].type = 'uint'
                            }
                            if (schema[key][ikey].properties[inkey].type == 'string') {
                                schema[key][ikey].properties[inkey].type = 'bytes32'
                            }
                            sol = sol.appendLine(`${schema[key][ikey].properties[inkey].type} ${schema[key][ikey].properties[inkey].name},`);
                        }

                    });
                }
            }
        });
        sol = sol.appendLine('}');
        return sol;
    },

    generateSolFileYaml(schemaString) {
        String.prototype.appendLine = function (s) {
            return `${this}\n${s}`
        };
        let schema = JSON.parse(schemaString);
        let sol = 'pragma solidity ^0.4.18;';
        sol = sol.appendLine('');
        sol = sol.appendLine(' contract ' + schema.title + '{');
        Object.keys(schema).forEach(function (key) {
            for (let ikey in schema[key]) {
                if (typeof schema[key][ikey] == 'object') {
                    sol = sol.appendLine('');
                    sol = sol.appendLine('function ' + schema[key][ikey].title + ' (');
                    Object.keys(schema[key][ikey]).forEach(function (inkey) {
                        if (inkey == "dependencies") {
                            sol = sol.appendLine('bytes32 ' + schema[key][ikey][inkey].name + ',');
                            sol = sol.appendLine('bytes32 ' + schema[key][ikey][inkey].type + ' )');
                            sol = sol.appendLine('public{}');
                        }
                        // else if (inkey =='returns'){
                        //     if((schema[key][ikey][inkey].type)!=undefined) {
                        //         if (schema[key][ikey][inkey].type == 'number')
                        //         schema[key][ikey][inkey].type = 'uint'
                        //         if (schema[key][ikey][inkey].type == 'string')
                        //         schema[key][ikey][inkey].type = 'bytes32'
                        //         sol = sol.appendLine( 'public constant returns(' + schema[key][ikey][inkey].type + '){}');
                        //     }
                        //     else
                        //     sol = sol.appendLine( 'public{}');
                        // }
                        else {
                            if (inkey != 'title') {
                                if (schema[key][ikey][inkey].type == 'number') {
                                    schema[key][ikey][inkey].type = 'uint';
                                }
                                if (schema[key][ikey][inkey].type == 'string') {
                                    schema[key][ikey][inkey].type = 'bytes32';
                                }
                                sol = sol.appendLine(`${schema[key][ikey][inkey].type} ${schema[key][ikey][inkey].name},`);
                            }
                        }

                    });
                }
            }
        });
        sol = sol.appendLine('}');
        return sol;
    },

    extractAssetsTransactions(schema) {
        let assets = {};

        if (typeof schema === 'string') {
            schema = JSON.parse(schema);
        }

        for(const property in schema.properties) {
            if (schema.properties.hasOwnProperty(property)) {
                let assetMeta = schema.properties[property];
                let assetType = assetMeta.dependencies.type;
                if (!assets[assetType]) {
                    assets[assetType] = {
                      transactions: []
                    }
                }
                assets[assetType].transactions.push(O.create({
                    title: assetMeta.title,
                    meta: assetMeta
                }));
            }
        }

        return Object.keys(assets).reduce((acc, key) => {
            acc.pushObject(O.create({
                title: key,
                transactions: assets[key].transactions
            }));
            return acc;
        }, A([]));
    },
    //dependency error checking
    depErr(yamlString){
        var array = []; 
        var result = [];
        array.push({ regex: /asset:\s{2,4}[^&]/ , msg: "Assets must have & symbol" });
        array.push({ regex: /dependencies:\s{2,12}[^*]/, msg: "Transactions must have * symbol" });
        var res = yamlString.split("\n"); 
        
        for( let r = 0; r < array.length; ++ r){
            let myRe = new RegExp(array[r].regex);
            for( let i = 0; i < res.length; ++i){
                if(myRe.exec(res[i])){
                    result.push({type: 'error', text:  array[r].msg, range: [i+1, myRe.exec(res[i]).index+1, i+1, 0] });
                    return result;
                } 
            }
    
        }
        //checking rules that asset id and type is set for an asset
        let myRe = new RegExp(/[-]\sasset:/); 
        let nameReg = new RegExp(/\s{2,8}\sname:/);
        let typeReg = new RegExp(/\s{2,8}\stype:/);
        for( let i = 0; i < res.length; ++i){
            if(myRe.exec(res[i])){
                if (!nameReg.exec(res[i+1])){
                    result.push({type: 'error', text:  'Asset must be followed by key name: ', range: [i+2, myRe.exec(res[i]).index+1, i+1, 0] });
                    return result;
                }
                if (!typeReg.exec(res[i+2])){
                    result.push({type: 'error', text:  'Asset must be followed by keys name: type:', range: [i+3, myRe.exec(res[i]).index+1, i+1, 0] });
                    return result;
                 }
             }
         }

},

validateYaml(yamlString){
    var result = [];
    var depResult = []; //error result from our asset and transaction rules
    try{   
        yaml.safeLoad(yamlString);
        result = this.depErr(yamlString);
       }catch(err){
            depResult = this.depErr(yamlString);
            if (depResult == undefined){
                result.push({type: 'error', text:  err.message, range: [err.mark.line,err.mark.column, err.mark.line, 0] });
                return result; 
            }
            else{
                return depResult;
            }
        } 
        return result; 
}
/*,

solToYaml(code){
    const compiledCode = solc.compile(code)
    const codeInterface = JSON.parse(compiledCode.contracts[':Container'].interface)
    let schema = {}; 
    schema.transaction = {};
    schema.transaction.properties = (typeof schema);
    var assetList =[];
    codeInterface.forEach(func =>{
        if(func.type != 'constructor'){
            let fn = {};      
            fn.title;
            fn.type = typeof(fn); 
            fn.properties = {};
            let isAsset = false;
            
            for (var key in func){
                if(key =="name"){
                    fn.title = func[key];
                  }
                  if(key == "inputs"){
                      for(var ikey in func[key]){
                          if(isAsset == true){
                              isAsset = false;
                              assetList[func[key][ikey].name]+=1;
                              fn.properties.dependencies  = "*" + func[key][ikey].name;
                              break;
                          }
                          if(func[key][ikey].name == "assetId"){
                              isAsset = true;
                          }
                          else{
                              fn.properties[func[key][ikey].name] = func[key][ikey];
                              if(func[key][ikey].type.startsWith("byte")){
                                  func[key][ikey].type = "string";
                              }
                              if(func[key][ikey].type.startsWith("uint")||func[key][ikey].type.startsWith("uint") ) {
                                  func[key][ikey].type = "number";
                              
                              }
                          }
                       }            
                  }
  
              }
              schema.transaction[fn.title] = fn;      
          }
    });
  
  var yamlString='---';
    for (var assets in assetList) {
        yamlString += "\n- asset:  &" + assets +" \n      name:   assetIDd\n      type:   "+assets;
    }
    yamlString+="\n";
    var ymlText = YAML.stringify(schema).replace(/["]+/g,'');
    var strYml = ymlText.replace("---", '')
    let outputYaml = yamlString + strYml; 
    return outputYaml;
  }*/

});