import Service from '@ember/service';
import {
    A
} from '@ember/array';
import O from '@ember/object';
import yaml from 'js-yaml';
import dagreD3 from 'dagre-d3';
import dot from 'graphlib-dot';
import solc from 'solc';
import { typeOf } from 'remedial';

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
            if (func.type !== 'constructor') {
                let fn = {};
                fn.title;
                fn.type = typeof (fn);
                fn.properties = {};
                let assetName;
                // let dummyReturn = {}; // unused variable
                let isAsset = false;

                for (let key in func) {
                    let asset = {};
                    if (key === "name") fn.title = func[key];
                    if (key === "inputs") {
                        for (let ikey in func[key]) {
                            if (isAsset === true) {
                                isAsset = false;
                                assetName = (func[key][ikey]);
                                asset.type = assetName.name;
                                break;
                            }
                            if (func[key][ikey].name === "assetId") {
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
        schema.description = "Smart Contract Form for the demo";
        schema.type = typeof (schema);
        schema.properties = {};
 
        const config = yaml.safeLoad(yamlString);
 
        if(Array.isArray(config)){
            config.forEach(func => {
                if (func !== null && Object.keys(func) !== 'asset') {
                    for (let key in func) {
                        for (let ikey in func[key]) {
                            if (typeof func[key][ikey].properties !== 'undefined')
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
        }
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
                if (schema[key][ikey].type === 'object') {
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
            if (x === undefined) {
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
                    if (pkey === 'dependencies') {
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
            if (x === undefined) {
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
                if (schema[key][ikey].type === 'object' ) {
                    sol = sol.appendLine('');
                    sol = sol.appendLine( 'function '  + schema[key][ikey].title + ' (' );
                    Object.keys(schema[key][ikey].properties).forEach(function (inkey) {
                        if (inkey === "dependencies") {
                            sol = sol.appendLine('bytes32 ' + schema[key][ikey].properties[inkey].assetId.name + ',');
                            sol = sol.appendLine('bytes32 ' + schema[key][ikey].properties[inkey].assetId.type + ')');
                        } else if (inkey === 'returns') {
                            if ((schema[key][ikey].properties[inkey].type) !== undefined) {
                                if (schema[key][ikey].properties[inkey].type === 'number') {
                                    schema[key][ikey].properties[inkey].type = 'uint'
                                }
                                if (schema[key][ikey].properties[inkey].type === 'string') {
                                    schema[key][ikey].properties[inkey].type = 'bytes32'
                                }
                                sol = sol.appendLine('public constant returns(' + schema[key][ikey].properties[inkey].type + '){}');
                            } else {
                                sol = sol.appendLine('public{}');
                            }
                        } else {
                            if (schema[key][ikey].properties[inkey].type === 'number') {
                                schema[key][ikey].properties[inkey].type = 'uint'
                            }
                            if (schema[key][ikey].properties[inkey].type === 'string') {
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
        schema.title = "Application";
        let sol = 'pragma solidity ^0.4.18;';
        let sol2 = '';
        sol = sol.appendLine('');
        sol = sol.appendLine(' contract ' + schema.title + '{');
        sol = sol.appendLine('function ' +schema.title + '() public{}');
        Object.keys(schema).forEach(function (key) {
            
            for (let ikey in schema[key]) {
                if (typeof schema[key][ikey] === 'object') {
                    sol = sol.appendLine('');
                    sol = sol.appendLine('function ' + schema[key][ikey].title + ' (');
                    Object.keys(schema[key][ikey]).forEach(function (inkey) {
                        if (inkey === "dependencies") {
                          let depend = schema[key][ikey][inkey];
             
                          if (depend !== 'none') {
                            sol2 = sol2.appendLine('bytes32 ' + schema[key][ikey][inkey].name + ',');
                            sol2 = sol2.appendLine('bytes32 ' + schema[key][ikey][inkey].type + ' )');
                        
                        } else {
                            if (sol.substr(-1)===',') {
                              sol = sol.substr(0, sol.length-1);
                            }
                           
                          }
                        //   sol = sol + sol2
                        // //   sol = sol+')';
                        //   sol = sol.appendLine('public{}');
                        }
                        // else if (inkey =='returns'){
                        //     if((schema[key][ikey][inkey].type)!=undefined) {
                        //         if (schema[key][ikey][inkey].type === 'number')
                        //         schema[key][ikey][inkey].type = 'uint'
                        //         if (schema[key][ikey][inkey].type === 'string')
                        //         schema[key][ikey][inkey].type = 'bytes32'
                        //         sol = sol.appendLine( 'public constant returns(' + schema[key][ikey][inkey].type + '){}');
                        //     }
                        //     else
                        //     sol = sol.appendLine( 'public{}');
                        // }
                        else {
                            if (inkey !== 'title') {
                                if (schema[key][ikey][inkey].type === 'number') {
                                    schema[key][ikey][inkey].type = 'uint';
                                }
                            //     if (schema[key][ikey][inkey].type === 'string') {
                            //         schema[key][ikey][inkey].type = 'bytes32';
                            //     }
                                sol = sol.appendLine(`${schema[key][ikey][inkey].type} ${schema[key][ikey][inkey].name},`);
                            }
                        }

                    });
                    sol = sol + sol2
                    sol2 = '';
                    sol = sol.appendLine('public{}');
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
        let array = []; 
        let result = [];
        array.push({ regex: /asset:\s{2,4}[^&]/ , msg: "Assets must have & symbol" });
        array.push({ regex: /dependencies:\s{2,12}[^*]/, msg: "Transactions must have * symbol" });
        let res = yamlString.split("\n"); 
        
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
    let result = [];
    let depResult = []; //error result from our asset and transaction rules
    try{   
        yaml.safeLoad(yamlString);
        result = this.depErr(yamlString);
       }catch(err){
            depResult = this.depErr(yamlString);
            if (depResult === undefined){
                result.push({type: 'error', text:  err.message, range: [err.mark.line,err.mark.column, err.mark.line, 0] });
                return result; 
            }
            else{
                return depResult;
            }
        } 
        return result; 
},

updateParamSchema(txnTitle, oldParamTitle, newParamTitle, paramType, schema){

    if (typeof schema === 'string') {
        schema = JSON.parse(schema);
    }

    for(const property in schema.properties) {
        if (schema.properties.hasOwnProperty(property)) {
            if(txnTitle == schema.properties[property].title){
                for(var pkey in schema.properties[property]){
                    if(pkey == oldParamTitle){
                        schema.properties[property][newParamTitle] = {}
                        schema.properties[property][newParamTitle].name = newParamTitle;
                        schema.properties[property][newParamTitle].type = paramType;
                        delete(schema.properties[property][pkey]);
                        
                    }
                }

            }
        }
    }

    let jsonSchema = JSON.stringify(schema).replace(/[[\]']+/g, '');
    return jsonSchema;   

},

updateParamSchemaType(txnTitle, paramTitle, newParamType, schema){
    if (typeof schema === 'string') {
        schema = JSON.parse(schema);
    }
     for(const property in schema.properties) {
        if (schema.properties.hasOwnProperty(property)) {
            if(txnTitle == schema.properties[property].title){
                for(var pkey in schema.properties[property]){
                    if(pkey == paramTitle){
                        schema.properties[property][pkey].type = newParamType;
                    }
                }

            }
        }
    }

    let jsonSchema = JSON.stringify(schema).replace(/[[\]']+/g, '');
    return jsonSchema;   

},
updateAssetSchema(newAssetTitle, oldAssetTitle, schema){

    if (typeof schema === 'string') {
        schema = JSON.parse(schema);
    }

    for(const property in schema.properties) {
        if (schema.properties.hasOwnProperty(property)) {
            let assetMeta = schema.properties[property];
            let assetType = assetMeta.dependencies.type;
            if(assetType==oldAssetTitle){
               schema.properties[property].dependencies.type = newAssetTitle;
            }
        }
    }

    let jsonSchema = JSON.stringify(schema).replace(/[[\]']+/g, '');

    return jsonSchema;   
},
updateTxnSchema(newTxnTitle, oldTxnTitle, schema) {

    if (typeof schema === 'string') {
        schema = JSON.parse(schema);
    }

    for(const property in schema.properties) {
        if (schema.properties.hasOwnProperty(property)) {
            if(oldTxnTitle === schema.properties[property].title){
                schema.properties[property].title = newTxnTitle;
            }
        }
    }

    let jsonSchema = JSON.stringify(schema).replace(/[[\]']+/g, '');

    return jsonSchema;   

},
updateSchemaDeleteTxn(txnName, schema) {
    if (typeof schema === 'string') {
        schema = JSON.parse(schema);
    } 

    delete(schema.properties[txnName]);
    let jsonSchema = JSON.stringify(schema).replace(/[[\]']+/g, '');

    return jsonSchema;   

},

updateSchemaAddTxn(txnName, assTitle, parameters, schema){
    if (typeof schema === 'string') {
        schema = JSON.parse(schema);
    }
    schema.properties[txnName] = {};
    schema.properties[txnName].title = txnName;
    schema.properties[txnName].dependencies = {};
    schema.properties[txnName].dependencies.type = assTitle;
    schema.properties[txnName].dependencies.name = 'assetId';
    for (let key in parameters) {
        if (parameters.hasOwnProperty(key)) {
            // console.log(key + " -> " + parameters[key].name, parameters[key].type);
          schema.properties[txnName][parameters[key].name] = {}
          schema.properties[txnName][parameters[key].name].name = parameters[key].name;
          schema.properties[txnName][parameters[key].name].type = parameters[key].type;
        }
    }

    let jsonSchema = JSON.stringify(schema).replace(/[[\]']+/g, '');

    return jsonSchema; 

},
schemaToYaml(genSchema){
    let schemaToParse = JSON.parse(genSchema);
    let schema = {};
    schema.transaction = {};
    schema.transaction.properties = (typeof schema);
    var assetList ={};

    Object.keys(schemaToParse).forEach(function(key) {        
        if(key === 'properties'){
        for(var ikey in schemaToParse[key]){            

            let fn = {};      
            fn.title;
            fn.type = typeof(fn);
            fn.properties = {};
            if (schemaToParse[key][ikey].hasOwnProperty('title') ) {
                fn.title = schemaToParse[key][ikey].title;
            }  
            if(schemaToParse[key][ikey].hasOwnProperty('dependencies')){
                assetList[schemaToParse[key][ikey].dependencies.type]=0;
                fn.properties.dependencies  = "*" + schemaToParse[key][ikey].dependencies.type;
           }
           for(var pkey in schemaToParse[key][ikey]){
               if(pkey != 'dependencies' && pkey !='title' ) 
               fn.properties[schemaToParse[key][ikey][pkey].name] = schemaToParse[key][ikey][pkey];
            }
            if(fn.hasOwnProperty('title')){
                schema.transaction[fn.title] = fn;   
            } 

        }
        
    }
        
    });
    let yamlString='---';

    for (var assets in assetList) {
        yamlString += "\n- asset:  &" + assets +" \n      name:   assetId\n      type:   "+assets;
    }
    yamlString+="\n";
    var ymlText = YAMLStringify(schema).replace(/["]+/g,'');
    var stripedYml = ymlText.replace("---", '')

    let outputYaml = yamlString + stripedYml; 
    return outputYaml;
  },

  compileSol(code, cb) {
    solc.BrowserSolc.loadVersion("soljson-v0.4.24+commit.e67f0147.js", function (compiler) {
      try {
        let c = compiler.compile(code);
        cb(c.errors);
      } catch(e) {
        cb(e);
      }
      cb();
    });
  },

  solToYaml(code, cb){

      let res = code.split("\n");

      let myRe = new RegExp(/public{}/)
      let myRe2 = new RegExp(/public\s{}/)
      let myRe3 = new RegExp(/}/)
      let myRe4 = new RegExp(/public{/)
      let myRe5 = new RegExp(/{/)
      let myRe6 = new RegExp(/public\s{/)
      let myReFunc = new RegExp(/function/)
      let infunction = false;
      let functionBody = {};
      functionBody.functionName = {};
      let bracketCount = 0;
      let lines = ''; 
       let fn = {}
      for( let i = 0; i < res.length; ++i){
        if(myReFunc.exec(res[i]) && (myRe.exec(res[i]) || myRe2.exec(res[i]))){
            continue;
      }
        if(myRe5.exec(res[i])){
            ++bracketCount;
       }
       if(myRe3.exec(res[i])){
           --bracketCount;
       }
        if(!myRe4.exec(res[i]) && myRe3.exec(res[i]) && bracketCount==1){
            infunction = false; 
            fn.lines = lines;
            functionBody.functionName[fn.title] = fn;
            lines = '';
            fn= {}
        }
          if(infunction){
            lines = lines + res[i];
            continue;
          }
      

        if(myReFunc.exec(res[i])){
           let spl = res[i].split(" ");  
           for (let x = 0; x< spl.length; ++x){
               if(spl[x]== "function"){
               fn.title = spl[x+1];
              }
            } 

        }
        if((myRe4.exec(res[i]) || myRe6.exec(res[i])) && !myRe3.exec(res[i])){
            infunction = true;
        }

        }
        let funct = JSON.stringify(functionBody);

        // console.log(funct);
      solc.BrowserSolc.loadVersion("soljson-v0.4.24+commit.e67f0147.js", function (compiler) {
      const compiledCode = compiler.compile(code)
      let className = /contract\s+(\w+)\s?{/.exec(code)[1];
      const codeInterface = JSON.parse(compiledCode.contracts[`:${className}`].interface)
      let schema = {}; 
      schema.transaction = {};

      var assetList ={};
      codeInterface.forEach(func =>{
        if(func.type != 'constructor'){
            let fn = {};      
            fn.title;
            fn.type = typeof(fn); 
            fn.properties = {};
            let isAsset = false;
            for (var key in func){
                if(key ==="name"){
                    for (var prop in functionBody) {
                        for (var pkey in functionBody[prop])
                        if (pkey === func[key]){
                            fn.functionBody = functionBody[prop][pkey].lines;
                        }
                    }
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
                          if(func[key][ikey].name === "assetId"){
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
  
      let yamlString='---';
      for (let assets in assetList) {
          yamlString += "\n- asset:  &" + assets +" \n      name:   assetId\n      type:   "+assets;
      }
      yamlString+="\n";
      let ymlText = YAMLStringify(schema).replace(/["]+/g,'');
      let strYml = ymlText.replace("---", '')
      let outputYaml = yamlString + strYml; 
      console.log(outputYaml); 

      cb(outputYaml);
    });
  }
});


function YAMLStringify(data) {
  let handlers
    , indentLevel = ''
    ;

  handlers = {
      "undefined": function () {
        // objects will not have `undefined` converted to `null`
        // as this may have unintended consequences
        // For arrays, however, this behavior seems appropriate
        return 'null';
      }
    , "null": function () {
        return 'null';
      }
    , "number": function (x) {
        return x;
      }
    , "boolean": function (x) {
        return x ? 'true' : 'false';
      }
    , "string": function (x) {
        // to avoid the string "true" being confused with the
        // the literal `true`, we always wrap strings in quotes
        return JSON.stringify(x);
      }
    , "array": function (x) {
        let output = ''
          ;

        if (0 === x.length) {
          output += '[]';
          return output;
        }

        indentLevel = indentLevel.replace(/$/, '  ');
        x.forEach(function (y) {
          // TODO how should `undefined` be handled?
          let handler = handlers[typeOf(y)]
            ;

          if (!handler) {
            throw new Error('what the crap: ' + typeOf(y));
          }

          output += '\n' + indentLevel + '- ' + handler(y);
            
        });
        indentLevel = indentLevel.replace(/ {2}/, '');
        
        return output;
      }
    , "object": function (x) {
        let output = ''
          ;

        if (0 === Object.keys(x).length) {
          output += '{}';
          return output;
        }

        indentLevel = indentLevel.replace(/$/, '  ');
        Object.keys(x).forEach(function (k) {
          let val = x[k]
            , handler = handlers[typeOf(val)]
            ;

          if ('undefined' === typeof val) {
            // the user should do
            // delete obj.key
            // and not
            // obj.key = undefined
            // but we'll error on the side of caution
            return;
          }

          if (!handler) {
            throw new Error('what the crap: ' + typeOf(val));
          }

          output += '\n' + indentLevel + k + ': ' + handler(val);
        });
        indentLevel = indentLevel.replace(/ {2}/, '');

        return output;
      }
    , "function": function () {
        // TODO this should throw or otherwise be ignored
        return '[object Function]';
      }
  };

  return '---' + handlers[typeOf(data)](data) + '\n';
}