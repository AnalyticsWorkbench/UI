var config = require('../config.js');
var conString = "postgres://" + config.messageConnectionConfig.user + ":"
    + config.messageConnectionConfig.password + "@"
    + config.messageConnectionConfig.host + "/"
    + config.messageConnectionConfig.internalname;
var pg = require('pg');
var pgp = require('pg-promise')();

/*
 Be careful with the inserted parameters for postgres.
 Identifiers with uppercase letters are automatically surrounded with quotes
 which can interfere with json queries (Ex. ->> A = B)
 */
module.exports = self = {

    //generic function to execute queries on the database without the boilerplate
    //Can use queries with or without parameters
    executeQuery: function (query, parameters, callback) {
        pg.connect(conString, function (err, client, done) {
            if (parameters.length > 0) {
                client.query(query, parameters, function (err, result) {
                    done();

                    if (err) {
                        console.error('error running query:');
                        console.error(query);
                        console.error('parameters: ', parameters);
                        console.error('error:');
                        console.error(err);

                    }
                    callback(result.rows);

                });
            } else {
                client.query(query, function (err, result) {
                    done();

                    if (err) {
                        console.error('error running query:');
                        console.error(query);
                        console.error('error:');
                        console.error(err);

                    }
                    callback(result.rows);
                });
            }
        });
    },

    /*
     Reads all scripts of the user with userID filtered by the visibility setting
     */
    readScripts: function (userID, publicOrUser, callback) {
        if (userID === null) {
            var query = 'SELECT rtuple FROM public.availablescripts WHERE rtuple ->> $1 = $2;';
            var parameters = ['public', 'public'];

        } else {
            var query = 'SELECT rtuple FROM public.availablescripts WHERE rtuple ->> $1 = $2 AND rtuple ->> $3 = $4;';
            var parameters = ['creator', userID.toString(), 'public', publicOrUser];
        }
        self.executeQuery(query, parameters, callback)
    },

    readScript: function (rscriptID, callback) {
        var query = 'SELECT rtuple FROM public.availablescripts WHERE rtuple ->> $1 = $2;';
        var parameters = ['saveid', rscriptID];
        self.executeQuery(query, parameters, function (tuples) {
            callback(tuples[0].rtuple);
        });
    },

    writeScript: function (rScriptID, userID, name, description, saveDate,
                           state, publicOrUser, rObject, callback) {
        var jsonData = {
            //fields numbered from 0 to 8 sqlspaces tuples RScript Flag is missing
            'saveid': rScriptID, //0
            'creator': userID, //2
            'name': name,  //3
            'description': description, //4
            'date': saveDate, //5
            'state': state,  //6
            'public': publicOrUser,  //7
            'robject': rObject  //8
        };

        var parameters = [jsonData];
        var query = "INSERT INTO public.availableScripts (rtuple) VALUES ($1);";
        self.executeQuery(query, parameters, callback);
    },
    /*Gets all rtuples that are public and visible to the user through the group settings
     *and their own private tuples
     */
    getAvailableScripts: function (userID, callback) {
        //read all public scripts
        self.readScripts(null, 'public', function (tuples) {
            if (tuples) {
                //cut out the public tuples, which aren't shared with the user
                self.trimPublicRScriptSetByVisibleUserShares(userID, tuples, function (newTuples) {
                    self.readOwnerTuples(userID, newTuples, callback);
                });
            } else {
                self.readOwnerTuples(userID, tuples, callback);
            }
        });

    },
    /*Read the rtuples of the user with userID that are not public then merge them with the
     *public and owned rtuples and give the results to the callback
     */
    readOwnerTuples: function (userID, publicTuples, callback) {

        self.readScripts(userID, 'user', function (ownerTuples) {


            var results = [];

            function addScriptData(tuples, input) {
                for (var i = 0; i < tuples.length; i++) {
                    var tuple = tuples[i].rtuple;
                    input.push(tuple);
                }
            }

            if (publicTuples) {
                addScriptData(publicTuples, results);
            }
            if (ownerTuples) {
                addScriptData(ownerTuples, results);
            }


            callback(results);
        });

    },
    /*
     Uses the data in parameters array to write tuples in public.availablescripts
     and public.rscriptlinkgroups if the rscript is made public
     */
    saveNewRscript: function (userID, parameters, callback) {
        var groups;
        var sharing = parameters['sharing'];

        var writeScript = function(){
                self.writeScript(parameters['saveid'], userID, parameters['name'], parameters['description'],
                    parameters['date'], 0, parameters['sharing'], parameters['fileset'], function () {
                        callback({saveid: parameters['saveid']});
        })};
        if (sharing == "public") {
            groups = parameters['groups'];
            //write R-scripts links group tuples
            var counter = 0;
            if(groups.length === 0){
                writeScript();
            }else {
                for (var i = 0; i < groups.length; i++) {
                    self.writeRscriptLinkGroup(parameters['saveid'], groups[i], function () {
                        counter++;
                        if (counter >= groups.length) {
                            writeScript();
                        }
                    });
                }
            }
        }else{
            writeScript();
        }


    },

    //not needed , getAvailableScripts does the same thing. The own version can be done with parameter
    //Why popo WHY!
    getLoadableRscripts: function (user, callback) {
        self.getAvailableScripts(user, callback);
    },
    getLoadableRScripts_own: function (user, callback) {
        self.readOwnerTuples(user, [], callback);
    },
    deleteRScript: function (user, rScriptID, callback) {
        rScriptID = rScriptID.toString();
        var query = 'DELETE FROM public.availablescripts WHERE rtuple ->> $1 = $2;';
        var parameters = ['saveid', rScriptID];
        self.executeQuery(query, parameters, function(){
            response = {};
            response.ok = true;
            response.saveid = rScriptID;
            callback(response);
        });
    },
    saveExistingRscript: function (userID, params, callback) {
        //TODO Async Ops need to be properly nested
        var selfThis = this;
        var description = "";
        if (params.description) {
            description = params.description;
        }

        var name = "";
        if (params.name) {
            name = params.name;
        }

        if (params.creator == userID) {
            self.deleteRScriptLinkGroup(params.saveid, function () {
                if (params.ifpublic) {
                    var groups = [];
                    if (params.groups) {
                        groups = params.groups;
                    }

                    for (var i = 0; i < groups.length; i++) {
                        self.writeRscriptLinkGroup(params.saveid, groups[i], function () {
                        });
                    }
                }
            });
        }

        var range = 'user';
        if (params.ifpublic) {
            range = 'public';
        }


        self.readScript(params.saveid, function (rScript) {
            var response;
            var rObject;
            if (rScript) {
                rObject = rScript.robject;
                if (params.fileset) {
                    rObject = params.fileset;
                }
                var publicOrUser = (params.creator != userID) ? rScript.public : range;
                self.deleteRScript(userID, params.saveid, function () {
                    self.writeScript(
                        params.saveid,
                        params.creator,
                        name,
                        description,
                        params.date,
                        1,
                        publicOrUser,
                        rObject,
                        function () {

                        });
                });
                response = {};
                response.ok = true;
                response.saveid = params.saveid;
                response.date = rScript.date;
                callback.call(selfThis, response);


            } else {
                response = {};
                response.ok = false;
                response.id = params.saveid;
                callback.call(selfThis, response);
            }
        })


    },
    //depends on getRscriptLinkGroups
    /*
     Removes all the tuples that are not visible to the user due to group settings
     */
    trimPublicRScriptSetByVisibleUserShares: function (userID, tuples, callback) {
        var results = [];
        var max = tuples.length;
        var counter = 0;
        getUserGroups(userID, function (userGroups) {
            if (max === 0) {
                callback(results);
            } else {
                if (userGroups) {
                    //Loop over all tuples and check if the user is part of a group that the rscript is shared with

                    for (var i = 0; i < max; i++) {
                        var rscriptID = tuples[i].rtuple.saveid;
                        self.getRscriptLinkGroups(tuples[i], rscriptID, function (tuple, groups) {
                            if (groups.length > 0) {
                                if (commonValue(userGroups, groups)) {
                                    results.push(tuple);
                                }
                            }
                            counter++
                            if (counter >= max) {
                                callback(results);
                            }
                        });
                    }
                }else{
                    callback(results);
                }
            }
        });
    },

    writeRscriptLinkGroup: function (rscriptID, group, callback) {
        var query = "INSERT INTO public.rscriptlinkgroups (link) VALUES ($1);";
        var link = {
            'saveid': rscriptID,
            'groupid': group,
        };
        var parameters = [link];
        self.executeQuery(query, parameters, callback);
    },
    /*
     Gets all the groups that the script is shared with
     */
    getRscriptLinkGroups: function (param, rscriptID, callback) {
        var query = "SELECT link FROM public.rscriptlinkgroups WHERE link ->> $1 = $2;";
        var parameters = ['saveid', rscriptID.toString()];
        self.executeQuery(query, parameters, function (tuples) {
            var groups = [];
            if (tuples && tuples.length > 0) {
                for (var i = 0; i < tuples.length; i++) {
                    groups.push(tuples[i].link.groupid);
                }
            }
            callback(param, groups);
        });

    },
    deleteRScriptLinkGroup: function (rscriptID, callback) {
        if (rscriptID === null) {
            var query = 'DELETE from public.rscriptlinkgroups';
            self.executeQuery(query, [], callback);
        } else {
            var query = 'Delete from public.rscriptlinkgroups WHERE link->> $1 = $2';
            var parameters = ['saveid', rscriptID];
            self.executeQuery(query, parameters, callback);
        }
    },

};

var commonValue = function (inArray1, inArray2) {
    if (inArray1 == null || inArray2 == null || inArray1 == undefined || inArray2 == undefined) {
        return false;
    }
    if (typeof(inArray1) != "object" || typeof(inArray2) != "object") {
        return false;
    }

    for (var x = 0; x < inArray1.length; x++) {
        for (var j = 0; j < inArray2.length; j++) {
            if (inArray1[x] == inArray2[j]) {
                return true;
            }
        }
    }
    return false;
};
/*
 Gets all the usergroups that the user is part of
 */
var getUserGroups = function (userID, callback) {
    var query = 'SELECT link FROM usergrouplink WHERE link ->> $1 = $2';
    var parameters = ['userid', userID.toString()];
    self.executeQuery(query, parameters, function (tuples) {
        var groups = tuples.map(function (item) {
            return item.link.groupid
        });
        callback(groups);
    });
};