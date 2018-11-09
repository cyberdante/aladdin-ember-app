import Service from '@ember/service';
import {
    A
} from '@ember/array';
import O from '@ember/object';
import { computed } from '@ember/object';
import yaml from 'js-yaml';
import dagreD3 from 'dagre-d3';
import dot from 'graphlib-dot';
import solc from 'solc';
import { typeOf } from 'remedial';

export default Service.extend({
    solCversion: computed(function() {
        return 'soljson-v0.4.24+commit.e67f0147.js';
    }),
    // *************************************************
    // Inputs: schemaInterface - An ABI definition object 
    //         corresponding to the given JSON text
    //
    //         title - Title given to the JSON schema  
    // Returns: A JSON string representing the schema
    // Description:  The ABI object passed in syntactic 
    //        components are iterated through building 
    //        the JSON schema. NOTE: within the JSON 
    //        schema the keyword \textit{dependencies} 
    //        signifies an asset relationship
    // *************************************************
    generateSchema(schemaInterface, title, code) {
    
    let enumEx = new RegExp(/enum\s{1,10}Assets/);
  
    let parse = code.split("Assets");
    let myRe = new RegExp(/\_/); 
    let myRe2 = new RegExp(/\./); 
    let assetType = {}
   
    let parseEnum = code.split(enumEx);
    parseEnum = parseEnum[1].split('}');
    parseEnum = parseEnum[0].split(',');
  
    for (let i = 0 ; i < parseEnum.length; ++i){
      parseEnum[i] = parseEnum[i].replace(/(\r\n\t|\n|\r\t)/g,"");
      parseEnum[i] = parseEnum[i].replace(/{/g,"");
      parseEnum[i] = parseEnum[i].replace(/ /g,"");
  
    }
  
  
    for ( let i = 1 ; i < parse.length; ++i){
        if(myRe.exec(parse[i]) && myRe2.exec(parse[i+1]) ){
        let functionName = parse[i].split("_");  
        functionName = functionName[1].split(" ");
        functionName = functionName[0];
        let assetName = parse[i+1].split(".");
        assetName = assetName[1].split(";");
        assetName = assetName[0];
        let fn = {};
        fn.assetName = assetName;
        fn.functionName = functionName
        assetType[functionName] = fn;
        for(let x = 0; x <parseEnum.length; ++x ){
            if(parseEnum[x]===assetName){
              delete parseEnum[x];          
            }
        }
        }
    }
  
    let schema = {}; 
    schema.$schema = "http://json-schema.org/draft-04/schema"; 
    schema.title = title; 
    schema.descrption = "Smart Contract Form for the demo";
    schema.type = typeof(schema);
    schema.properties = {};
    let isAsset;
    schemaInterface.forEach(func =>{
      if(func.type != 'constructor'){
      let fn = {};      
      fn.dependencies ={};
         
        for (let key in func){
         
            if(key =="name"){
                 fn.title = func[key];
                 for(let functionName in assetType){
                    if (functionName === fn.title){
                      if(isAsset === true){
                        let assets = {};
                        assets.type = assetType[functionName].assetName;
                        assets.name = functionName;
                        fn.dependencies= assets;
                        isAsset = false;
                     
                     }
                  }
  
               }
               break;
  
            }
          
            if(key == "inputs"){
                for(let ikey in func[key]){
                
                  if(func[key][ikey].name == "assetId"){
                      isAsset = true;
                                           
                   }
                    let prop = {};
                    prop.type = func[key][ikey].type;
                    prop.name = func[key][ikey].name;
                    fn[func[key][ikey].name] = prop;
                    }            
            }
            if(key == 'outputs'){
                if( func[key].length < 1){
                  dummyReturn = {};
                  fn.properties.returns= dummyReturn;
              }
              for(let ikey in func[key]){
                  fn.properties.returns =func[key][ikey];
             }
          }
        }
     
        schema.properties[fn.title] = fn;
        }
    //     if(func.type == 'constructor'){
    //     for (let key in func){
    //       //   console.log(func[key])
    //     }
    //   }
        
    });
    for(let x = 0; x <parseEnum.length; ++x ){
        if (parseEnum[x]!=undefined){
            schema.properties[`_new_standalone_asset_${parseEnum[x]}`]={};
            let fn = {};      
            fn.dependencies ={};
            let assets = {};
            assets.type = parseEnum[x];
            assets.name = 'unknown';
            fn.dependencies= assets;
            schema.properties[`_new_standalone_asset_${parseEnum[x]}`] = fn;
        }
    }

    let json_schema = JSON.stringify(schema).replace(/[\[\]']+/g,'');
    return json_schema;
    },

     addAsset(genSchema, assetName){
        let schemaToParse = JSON.parse(genSchema);
    
       let fn = {};
    
        Object.keys(schemaToParse).forEach(function (key) {
            if (key === 'properties') {
                schemaToParse.properties[`_new_standalone_asset_${assetName}`]={};
                let assets = {};
                assets.type = assetName;
                assets.name = 'unknown';
                fn.dependencies= assets;
                schemaToParse.properties[`_new_standalone_asset_${assetName}`] = fn;
               
            }
        });
            
        let json_schema = JSON.stringify(schemaToParse).replace(/[\[\]']+/g,'');
    
        return json_schema;
    },
   deleteAsset(genSchema, assetName){
        let schemaToParse = JSON.parse(genSchema);
          Object.keys(schemaToParse).forEach(function (key) {
            for (let ikey in schemaToParse[key]) {
                if(schemaToParse[key][ikey].dependencies){
                    if(schemaToParse[key][ikey].dependencies.type === assetName){
                    delete schemaToParse[key][ikey];
                   }
    
                }
             }
        });
        let json_schema = JSON.stringify(schemaToParse).replace(/[\[\]']+/g,'');
    
        return json_schema;
    },

    generateSchemaYaml(yamlString, title) {
        let schema = {};
        schema.$schema = "http://json-schema.org/draft-04/schema";
        schema.title = title;
        schema.description = "Smart Contract Form for the demo";
        schema.type = typeof (schema);
        schema.properties = {};
        const config = yaml.safeLoad(yamlString);
        let parseAssets = [];


        if (Array.isArray(config)) {
            config.forEach(func => {
                if (func !== null && Object.keys(func) !== 'asset') {
                    for (let key in func) {
                        for (let akey in func[key]) {
                            if (func[key][akey]!='assetId'){
                                if(typeof func[key][akey] != 'object' && func[key][akey]!='object'){
                                parseAssets[func[key][akey]] =func[key][akey];
                                }

                            }
                        }
                    }
                }
            }); 
        }

        if (Array.isArray(config)) {
            config.forEach(func => {
                if (func !== null && Object.keys(func) !== 'asset') {
                    for (let key in func) {
                        for (let ikey in func[key]) {
                                        
                            if (typeof func[key][ikey].properties !== 'undefined')
                            if(func[key][ikey].properties.dependencies){
                            
                                for (let x in parseAssets) {
                                    if(parseAssets[x]===func[key][ikey].properties.dependencies.type){
                                      delete parseAssets[x];          
                                    }
                                }
                            }
                                schema.properties[func[key][ikey].title] = func[key][ikey].properties;
                                     Object.keys(func[key][ikey]).forEach(function (pkey) {
                                         if (pkey === 'title') {
                                             schema.properties[func[key][ikey].title].title = func[key][ikey].title;
                                } 
                            });
                        }
                    }
                }
             });
             for (let x in parseAssets) {
                if (parseAssets[x]!=undefined){
                    schema.properties[`_new_standalone_asset_${parseAssets[x]}`]={};
                    let fn = {};      
                    fn.dependencies ={};
                    let assets = {};
                    assets.type = parseAssets[x];
                    assets.name = 'unknown';
                    fn.dependencies= assets;
                    schema.properties[`_new_standalone_asset_${parseAssets[x]}`] = fn;
                }

             }
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
                    if (schema[key][ikey].properties.dependencies && schema[key][ikey].properties.dependencies.name!='unknown') {
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
                    if (schema[key][ikey].properties.dependencies && schema[key][ikey].properties.dependencies.name==='unknown') {
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
        let nodeAsset = {
            color: 'slategray3',
            shape: 'diamond',
            style: 'filled'
        };

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
                    if (pkey === 'dependencies' && schema[key][ikey].dependencies.name!='unknown' ) {
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
                    if (pkey === 'dependencies' && schema[key][ikey].dependencies.name==='unknown' ) {
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
        
        schema.title = "Application";
        let sol = 'pragma solidity ^0.4.24;';
    
        sol = sol.appendLine('');
    
        sol = sol.appendLine(' contract ' + schema.title + '{');
        sol = sol.appendLine('function ' + schema.title + '() public{}');
        let assetsfunc= [];
        let assets= [];
    
    
        
        Object.keys(schema).forEach(function (key) {
                //array of assets for enum
                for (let ikey in schema[key]) {
                    if (typeof schema[key][ikey] === 'object') {
                        Object.keys(schema[key][ikey]).forEach(function (inkey) {
                            if (inkey === "dependencies") {
                                assetsfunc[schema[key][ikey][inkey].name] = schema[key][ikey][inkey].type;
                                assets[schema[key][ikey][inkey].type] = schema[key][ikey][inkey].name;
                            }
                        });
                        
                    }
                } 
        });
    
       
        // enum Assets {container, lock}
   
        let solEns = "enum Assets {"
        for (let enms in assets){
            solEns = solEns + `${enms}, `;        
        }
    
        let newsolEns= solEns.substr(0, solEns.length - 2);
        newsolEns += '}';
        sol = sol.appendLine(newsolEns);
        let myRe = new RegExp(/_new_standalone_asset_/);
        for (let asset in assetsfunc){
            if(!myRe.exec(asset)){
            sol = sol.appendLine(`Assets _${asset} = Assets.${assetsfunc[asset]};`);
            }
    
        }
        let length = [];
        let len = 0;
            for( let key in schema ) {
                for (let ikey in schema[key]) {
                    if (typeof schema[key][ikey] === 'object') {
                        Object.keys(schema[key][ikey]).forEach(function (inkey) {
                            if (inkey != 'title' ) {
                                ++len;
                                length[ikey]= len;
                            }
                        });
                    len = 0;
                    }
                }
            }
       
        Object.keys(schema).forEach(function (key) {
    
            for (let ikey in schema[key]) {
                if (typeof schema[key][ikey] === 'object') {
                    sol = sol.appendLine('');
                    sol = sol.appendLine('function ' + schema[key][ikey].title + ' (');
                    Object.keys(schema[key][ikey]).forEach(function (inkey) {
                        if (inkey !== 'title') {
                            ++len;
                            if( len < length[ikey]){
                                if (schema[key][ikey][inkey].type === 'number') {
                                    schema[key][ikey][inkey].type = 'uint';
                                }
                                if(schema[key][ikey][inkey].name === 'assetId'){
                                    sol = sol.appendLine(`string ${schema[key][ikey][inkey].name},    /* parameter needed for linking assets and transactions */`);
                                    
                                }
                                else{
                                sol = sol.appendLine(`${schema[key][ikey][inkey].type} ${schema[key][ikey][inkey].name},    /* optional parameter */`);
                                }
                            }
                            else{
                                if (schema[key][ikey][inkey].type === 'number') {
                                    schema[key][ikey][inkey].type = 'uint';
                                }
                                if(schema[key][ikey][inkey].name === 'assetId'){
                                    sol = sol.appendLine(`string ${schema[key][ikey][inkey].name} )    /* parameter needed for linking assets and transactions */`);
                                    
                                }
                                else{
                                sol = sol.appendLine(`${schema[key][ikey][inkey].type} ${schema[key][ikey][inkey].name} )   /* optional parameter */`);
                                }
                            }
                            }
                            
                    });
                    len = 0;
                    sol = sol.appendLine('public{}');
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
        let sol = 'pragma solidity ^0.4.24;';
    
        sol = sol.appendLine('');
    
        sol = sol.appendLine(' contract ' + schema.title + '{');
        sol = sol.appendLine('function ' + schema.title + '() public{}');
        let assetsfunc= [];
        let assets= [];
           
        Object.keys(schema).forEach(function (key) {
                //array of assets for enum
                for (let ikey in schema[key]) {
                    if (typeof schema[key][ikey] === 'object') {
                        Object.keys(schema[key][ikey]).forEach(function (inkey) {
                            if (inkey === "dependencies") {
                                assetsfunc[ikey] = schema[key][ikey][inkey].type;
                                assets[schema[key][ikey][inkey].type] = ikey;
                            }
                        });
                        
                    }
                } 
        });
    
        let solEns = "enum Assets {"
        for (let enms in assets){
            solEns = solEns + `${enms}, `;        
        }
    
        let newsolEns= solEns.substr(0, solEns.length - 2);
        newsolEns += '}';
        sol = sol.appendLine(newsolEns);
        let myRe = new RegExp(/_new_standalone_asset_/);
        for (let asset in assetsfunc){
            if(!myRe.exec(asset)){
            sol = sol.appendLine(`Assets _${asset} = Assets.${assetsfunc[asset]};`);
            }
    
        }
        let length = [];
        let len = 0;
            for( let key in schema ) {
                for (let ikey in schema[key]) {
                    if (typeof schema[key][ikey] === 'object') {
                        Object.keys(schema[key][ikey]).forEach(function (inkey) {
                            if (inkey != 'title') {
                                ++len;
                                length[ikey]= len;
                            }
                        });
                    len = 0;
                    }
                }
            }
       
        Object.keys(schema).forEach(function (key) {
    
            for (let ikey in schema[key]) {
                if (typeof schema[key][ikey] === 'object') {
                    if(schema[key][ikey].title!= undefined){
                    sol = sol.appendLine('');
                    sol = sol.appendLine('function ' + schema[key][ikey].title + ' (');
                    Object.keys(schema[key][ikey]).forEach(function (inkey) {
                        if (inkey !== 'title' ) {
                            ++len;
                            if( len < length[ikey]){
                              
                                if (schema[key][ikey][inkey].type === 'number') {
                                    schema[key][ikey][inkey].type = 'uint';
                                }
                                if(schema[key][ikey][inkey].name === 'assetId'){
                                    sol = sol.appendLine(`string ${schema[key][ikey][inkey].name},    /* parameter needed for linking assets and transactions */`);
                                    
                                }
                                else{
                                sol = sol.appendLine(`${schema[key][ikey][inkey].type} ${schema[key][ikey][inkey].name},    /* optional parameter */`);
                                }
                            }
                            else{
                                if (schema[key][ikey][inkey].type === 'number') {
                                    schema[key][ikey][inkey].type = 'uint';
                                }
                                if(schema[key][ikey][inkey].name === 'assetId'){
                                    sol = sol.appendLine(`string ${schema[key][ikey][inkey].name} )    /* parameter needed for linking assets and transactions */`);
                                    
                                }
                                else{
                                sol = sol.appendLine(`${schema[key][ikey][inkey].type} ${schema[key][ikey][inkey].name} )   /* optional parameter */`);
                                }
                            }
                            }
                            
                            
                    });
                    len = 0;
                    sol = sol.appendLine('public{}');
                }
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
        
        for (const property in schema.properties) {
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
    depErr(yamlString) {
        let array = [];
        let result = [];
        array.push({ regex: /asset:\s{2,4}[^&]/, msg: "Assets must have & symbol" });
        array.push({ regex: /dependencies:\s{2,12}[^*]/, msg: "Transactions must have * symbol" });
        let res = yamlString.split("\n");

        for (let r = 0; r < array.length; ++r) {
            let myRe = new RegExp(array[r].regex);
            for (let i = 0; i < res.length; ++i) {
                if (myRe.exec(res[i])) {
                    result.push({ type: 'error', text: array[r].msg, range: [i + 1, myRe.exec(res[i]).index + 1, i + 1, 0] });
                    return result;
                }
            }

        }
        //checking rules that asset id and type is set for an asset
        let myRe = new RegExp(/[-]\sasset:/);
        let nameReg = new RegExp(/\s{2,8}\sname:/);
        let typeReg = new RegExp(/\s{2,8}\stype:/);
        for (let i = 0; i < res.length; ++i) {
            if (myRe.exec(res[i])) {
                if (!nameReg.exec(res[i + 1])) {
                    result.push({ type: 'error', text: 'Asset must be followed by key name: ', range: [i + 2, myRe.exec(res[i]).index + 1, i + 1, 0] });
                    return result;
                }
                if (!typeReg.exec(res[i + 2])) {
                    result.push({ type: 'error', text: 'Asset must be followed by keys name: type:', range: [i + 3, myRe.exec(res[i]).index + 1, i + 1, 0] });
                    return result;
                }
            }
        }

    },

    validateYaml(yamlString) {
        let result = [];
        let depResult = []; //error result from our asset and transaction rules
        try {
            yaml.safeLoad(yamlString);
            result = this.depErr(yamlString);
        } catch (err) {
            depResult = this.depErr(yamlString);
            if (depResult === undefined) {
                result.push({ type: 'error', text: err.message, range: [err.mark.line, err.mark.column, err.mark.line, 0] });
                return result;
            }
            else {
                return depResult;
            }
        }
        return result;
    },

    updateParamSchema(txnTitle, oldParamTitle, newParamTitle, paramType, schema) {

        if(oldParamTitle === newParamTitle) return schema;
        if(newParamTitle){

        if (typeof schema === 'string') {
            schema = JSON.parse(schema);
        }

        for (const property in schema.properties) {
            if (schema.properties.hasOwnProperty(property)) {
                if (txnTitle === schema.properties[property].title) {
                    for (let pkey in schema.properties[property]) {
                        if (pkey === oldParamTitle) {
                            schema.properties[property][newParamTitle] = {};
                            schema.properties[property][newParamTitle].name = newParamTitle;
                            schema.properties[property][newParamTitle].type = paramType;
                            delete (schema.properties[property][pkey]);

                        }
                    }

                }
            }
        }

        let jsonSchema = JSON.stringify(schema).replace(/[[\]']+/g, '');
        return jsonSchema;
    }
    else {
        throw new Error('invalid param title');
    }

    },
    deleteParam(txnTitle, paramTitle,schema) {
        if (typeof schema === 'string') {
            schema = JSON.parse(schema);
        }

        for (const property in schema.properties) {
            if (schema.properties.hasOwnProperty(property)) {
                if (txnTitle === schema.properties[property].title) {
                    for (let pkey in schema.properties[property]) {
                        if (pkey === paramTitle) {
                            delete (schema.properties[property][pkey]);

                        }
                    }

                }
            }
        }

        let jsonSchema = JSON.stringify(schema).replace(/[[\]']+/g, '');
        return jsonSchema;
    },

    updateParamSchemaType(txnTitle, paramTitle, newParamType, schema) {
        if (typeof schema === 'string') {
            schema = JSON.parse(schema);
        }
        for (const property in schema.properties) {
            if (schema.properties.hasOwnProperty(property)) {
                if (txnTitle == schema.properties[property].title) {
                    for (let pkey in schema.properties[property]) {
                        if (pkey == paramTitle) {
                            schema.properties[property][pkey].type = newParamType;
                        }
                    }

                }
            }
        }

        let jsonSchema = JSON.stringify(schema).replace(/[[\]']+/g, '');
        return jsonSchema;

    },

    updateAssetSchema(newAssetTitle, oldAssetTitle, schema) {
        if(newAssetTitle){

        if (typeof schema === 'string') {
            schema = JSON.parse(schema);
        }

        for (const property in schema.properties) {
            if (schema.properties.hasOwnProperty(property)) {
                let assetMeta = schema.properties[property];
                let assetType = assetMeta.dependencies.type;
                if (assetType == oldAssetTitle) {
                    schema.properties[property].dependencies.type = newAssetTitle;
                }
            }
        }

        let jsonSchema = JSON.stringify(schema).replace(/[[\]']+/g, '');

        return jsonSchema;
    }
    else {
        throw new Error('invalid Asset name');
    }
    },
    updateTxnSchema(newTxnTitle, oldTxnTitle, schema) {

        if (typeof schema === 'string') {
            schema = JSON.parse(schema);
        }

        for (const property in schema.properties) {
            if (schema.properties.hasOwnProperty(property)) {
                if (oldTxnTitle === schema.properties[property].title) {
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

        delete (schema.properties[txnName]);
        let jsonSchema = JSON.stringify(schema).replace(/[[\]']+/g, '');

        return jsonSchema;

    },

    updateSchemaAddTxn(txnName, assTitle, parameters, schema, bundlehash) {
        if (typeof schema === 'string') {
            schema = JSON.parse(schema);
        }
        
        if(schema.properties) {
            schema.properties[txnName] = {};
            schema.properties[txnName].title = txnName;
            schema.properties[txnName].dependencies = {};
            schema.properties[txnName].dependencies.type = assTitle;
            schema.properties[txnName].dependencies.name = 'assetId';
            parameters.forEach(func => {
                if(func && func.name) {
                    schema.properties[txnName][func.name] = {};
                    schema.properties[txnName][func.name].name = func.name;
                    schema.properties[txnName][func.name].type = func.type;
                }
            });

            if(bundlehash) {
                schema.properties[txnName]['bundlehash'] = {};
                schema.properties[txnName]['bundlehash'].name ='bundlehash';
                schema.properties[txnName]['bundlehash'].type = 'string';

            }
        } else {
            throw new Error('Invalid schema. No properties attribute inside.');
        }
        let jsonSchema = JSON.stringify(schema).replace(/[[\]']+/g, '');

        return jsonSchema;

    },
    schemaToYaml(genSchema) {
        
        let schemaToParse = JSON.parse(genSchema);
        let schema = {};
        schema.transaction = {};
        schema.transaction.properties = (typeof schema);
        let assetList = {};
        Object.keys(schemaToParse).forEach(function (key) {
            if (key === 'properties') {
                for (let ikey in schemaToParse[key]) {
                    
                    let fn = {};
                    fn.title;
                    fn.type = typeof (fn);
                    fn.properties = {};
                    // if(schemaToParse[key][ikey].dependencies.name !='unknown'){
                    if (schemaToParse[key][ikey].hasOwnProperty('dependencies')) {
                        assetList[schemaToParse[key][ikey].dependencies.type] = 0;
                        fn.properties.dependencies = "*" + schemaToParse[key][ikey].dependencies.type;
                    }
                    
                    if (schemaToParse[key][ikey].hasOwnProperty('title')) {
                        fn.title = schemaToParse[key][ikey].title;
                    

                    for (let pkey in schemaToParse[key][ikey]) {
                        if (pkey != 'dependencies' && pkey != 'title')
                            fn.properties[schemaToParse[key][ikey][pkey].name] = schemaToParse[key][ikey][pkey];
                    }
                    if (fn.hasOwnProperty('title')) {
                        schema.transaction[fn.title] = fn;
                    }
                
                }
            }

            }

        });
        let yamlString = '---';

        for (let assets in assetList) {
            yamlString += "\n- asset:  &" + assets + " \n      name:   assetId\n      type:   " + assets;
        }
        yamlString += "\n";
        let ymlText = YAMLStringify(schema).replace(/["]+/g, '');
        let stripedYml = ymlText.replace("---", '');

        let outputYaml = yamlString + stripedYml;
        return outputYaml;
    },

    compileSol(code, cb) {
        solc.BrowserSolc.loadVersion(this.get('solCversion'), function (compiler) {
            try {
                let c = compiler.compile(code);
                cb(c.errors);
            } catch (e) {
                cb(e);
            }
            cb();
        });
    },

    solToYaml(code, cb) {
        // Don't compile an empty string
        if(code.trim() === '') {
            cb();
            return;
        }

        // const compiledCode = solc.compile(code)
        let enumEx = new RegExp(/enum\s{1,10}Assets/)
      
        let parse = code.split("Assets");
        let myRe = new RegExp(/\_/); 
        let myRe2 = new RegExp(/\./); 
        let assetType = {}
              
        let parseEnum = code.split(enumEx);
       
        if(parseEnum.length >1){
        parseEnum = parseEnum[1].split('}');
        parseEnum = parseEnum[0].split(',');
      
        for (let i = 0 ; i < parseEnum.length; ++i){
          parseEnum[i] = parseEnum[i].replace(/(\r\n\t|\n|\r\t)/g,"");
          parseEnum[i] = parseEnum[i].replace(/{/g,"");
          parseEnum[i] = parseEnum[i].replace(/ /g,"");
      
        }
      
      
        for ( let i = 1 ; i < parse.length; ++i){
            if(myRe.exec(parse[i]) && myRe2.exec(parse[i+1]) ){
            let functionName = parse[i].split("_");  
            functionName = functionName[1].split(" ");
            functionName = functionName[0];
            let assetName = parse[i+1].split(".");
            assetName = assetName[1].split(";");
            assetName = assetName[0];
            let fn = {};
            fn.assetName = assetName;
            fn.functionName = functionName;
            assetType[functionName] = fn;
            for(let x = 0; x <parseEnum.length; ++x ){
                if(parseEnum[x]===assetName){
                  delete parseEnum[x];          
                }
            }
            }
        }
    }
    solc.BrowserSolc.loadVersion(this.get('solCversion'), function (compiler) {
            const compiledCode = compiler.compile(code);
            // Check if an error occured during compilation. This is the case if
            // compiledCode.contracts is an empty object.
            if(Object.keys(compiledCode.contracts).length === 0 && compiledCode.contracts.constructor === Object) {
                // Update the error log with errors
                cb(compiledCode.errors);
                return;
            }
            // Return errors if there are any before proceeding
            let className = /contract\s+(\w+)\s?{/.exec(code)[1];
            const codeInterface = JSON.parse(compiledCode.contracts[`:${className}`].interface);
            let schema = {}; 
            schema.transaction = {};
            schema.transaction.properties = (typeof schema);
            let assetList =[];
            codeInterface.forEach(func =>{
                if(func.type != 'constructor'){
                    let fn = {};      
                    fn.title;
                    fn.type = typeof(fn);
                    fn.properties = {};
                    let isAsset = false;
           
                    for (let key in func){
                      //   let asset = {};
                        
                        if(key =="name"){
                            fn.title = func[key];
                          }
                          if(key == "inputs"){
                              for(let ikey in func[key]){
                                  if(isAsset == true){
                                      isAsset = false;
                                      assetList[func[key][ikey].name]+=1;
                                      fn.properties.dependencies  = "*" + func[key][ikey].name;
                                      break;
                                  }
                                  if(func[key][ikey].name == "assetId"){
                                    //   asset = func[key][ikey].name;
                                      isAsset = true;
                                      break;
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
          
                      for(let functionName in assetType){
                          if (functionName === fn.title){
                            if(isAsset === true){
                            fn.dependencies = {};
                            let assets = {};
                            assets.type = assetType[functionName].assetName;
                            assets.name = "assetId";
                            fn.dependencies= assets;
                            isAsset = false;
                            fn.properties.dependencies  = "*" + assets.type;
                            assetList[assets.type]+=1;
                           
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
            for(let x = 0; x <parseEnum.length; ++x ){
              if (parseEnum[x]!=undefined){
                  yamlString += "\n- asset:  &" +parseEnum[x] +" \n      name:   assetId\n      type:   "+parseEnum[x];
              }
          }
          
            yamlString+="\n";
            let ymlText = YAMLStringify(schema).replace(/["]+/g, '');
            let stripedYml = ymlText.replace("---", '')
            let outputYaml = yamlString + stripedYml; 
            cb(outputYaml);
        });
    }
});


function YAMLStringify(data) {
    let handlers,
        indentLevel = '';

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
