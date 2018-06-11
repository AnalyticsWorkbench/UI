var config = require('./config.js');
var conString = "postgres://" + config.workbenchConnectionConfig.user + ":" + config.workbenchConnectionConfig.password + "@" + config.workbenchConnectionConfig.host + "/" + config.workbenchConnectionConfig.internalname;
var pg = require('pg');


var client = new pg.Client(conString);

// connect

pg.connect(conString, function (err, client, done) {
        if (err) {
            return console.error('could not connect to postgres', err);
        }

        // create workflow table

        client.query('SELECT relname FROM pg_class WHERE relname = $1', ['workflow'], function (err, result) {
            if (err)
                return console.error('error running query', err);

            done();

            if (result.rows.length == 0) {
                console.log('Workflow table does not exist, creating  .. :-)');

                client.query('CREATE TABLE workflow (id serial primary key, workflowjson json)', function (err, result) {
                    if (err)
                        return console.error('error running query', err);

                    done();
                });
            }
        });

        // create runmessage table

        client.query('SELECT relname FROM pg_class WHERE relname = $1', ['runmessage'], function (err, result) {
            if (err)
                return console.error('error running query', err);

            done();

            if (result.rows.length == 0) {
                console.log('Runmessage table does not exist, creating  .. :-)');

                client.query('CREATE TABLE runmessage (id serial primary key, runjson json)', function (err, result) {
                    if (err)
                        return console.error('error running query', err);

                    done();
                });
            }
        });

        // create result table

        client.query('SELECT relname FROM pg_class WHERE relname = $1', ['result'], function (err, result) {
            if (err)
                return console.error('error running query', err);

            done();

            if (result.rows.length == 0) {
                console.log('Result table does not exist, creating  .. :-)');

                client.query('CREATE TABLE result (id serial primary key, result json)', function (err, result) {
                    if (err)
                        return console.error('error running query', err);

                    done();
                });
            }
        });

        // create user table

        client.query('SELECT relname FROM pg_class WHERE relname = $1', ['userdata'], function (err, result) {
            if (err)
                return console.error('error running query', err);

            done();

            if (result.rows.length == 0) {
                console.log('Userdata table does not exist, creating  .. :-)');

                client.query('CREATE TABLE userdata (id serial primary key, userdata json)', function (err, result) {
                    if (err)
                        return console.error('error running query', err);

                    done();
                });
            }
        });

        // create group table

        client.query('SELECT relname FROM pg_class WHERE relname = $1', ['groupdata'], function (err, result) {
            if (err)
                return console.error('error running query', err);

            done();

            if (result.rows.length == 0) {
                console.log('Groupdata table does not exist, creating  .. :-)');

                client.query('CREATE TABLE groupdata (id serial primary key, groupdata json)', function (err, result) {
                    if (err)
                        return console.error('error running query', err);

                    done();
                });
            }
        });

        // create role table

        client.query('SELECT relname FROM pg_class WHERE relname = $1', ['roledata'], function (err, result) {
            if (err)
                return console.error('error running query', err);

            done();

            if (result.rows.length == 0) {
                console.log('Role table does not exist, creating  .. :-)');

                client.query('CREATE TABLE roledata (id serial primary key, roledata json)', function (err, result) {
                    if (err)
                        return console.error('error running query', err);

                    done();
                });
            }
        });

        // create user group link table

        client.query('SELECT relname FROM pg_class WHERE relname = $1', ['usergrouplink'], function (err, result) {
            if (err)
                return console.error('error running query', err);

            done();

            if (result.rows.length == 0) {
                console.log('Usergrouplink table does not exist, creating  .. :-)');

                client.query('CREATE TABLE usergrouplink (id serial primary key, link json)', function (err, result) {
                    if (err)
                        return console.error('error running query', err);

                    done();
                });
            }
        });

        // create user role link table

        client.query('SELECT relname FROM pg_class WHERE relname = $1', ['userrolelink'], function (err, result) {
            if (err)
                return console.error('error running query', err);

            done();

            if (result.rows.length == 0) {
                console.log('Userrolelink table does not exist, creating  .. :-)');

                client.query('CREATE TABLE userrolelink (id serial primary key, link json)', function (err, result) {
                    if (err)
                        return console.error('error running query', err);

                    done();
                });
            }
        });

        // create workflow group link table

        client.query('SELECT relname FROM pg_class WHERE relname = $1', ['workflowgrouplink'], function (err, result) {
            if (err)
                return console.error('error running query', err);

            done();

            if (result.rows.length == 0) {
                console.log('Workflowgrouplink table does not exist, creating  .. :-)');

                client.query('CREATE TABLE workflowgrouplink (id serial primary key, link json)', function (err, result) {
                    if (err)
                        return console.error('error running query', err);

                    done();
                });
            }
        });

        // create run group link table

        client.query('SELECT relname FROM pg_class WHERE relname = $1', ['rungrouplink'], function (err, result) {
            if (err)
                return console.error('error running query', err);

            done();

            if (result.rows.length == 0) {
                console.log('Rungrouplink table does not exist, creating  .. :-)');

                client.query('CREATE TABLE rungrouplink (id serial primary key, link json)', function (err, result) {
                    if (err)
                        return console.error('error running query', err);

                    done();
                });
            }
        });

        // create run group link table

        client.query('SELECT relname FROM pg_class WHERE relname = $1', ['autoexecution'], function (err, result) {
            if (err)
                return console.error('error running query', err);

            done();

            if (result.rows.length == 0) {
                console.log('Autoexecution table does not exist, creating  .. :-)');

                client.query('CREATE TABLE autoexecution (id serial primary key, autoexe json)', function (err, result) {
                    if (err)
                        return console.error('error running query', err);

                    done();
                });
            }
        });

        // create trigger
        console.log("create run update trigger");
        client.query("DROP TRIGGER IF EXISTS run_update ON runmessage", function (err, res) {
            if (!err) {
                done();

                client.query("CREATE OR REPLACE FUNCTION run_update() RETURNS TRIGGER AS $$ " +
                    "BEGIN " +
                    "PERFORM pg_notify('run_update', row_to_json(NEW)::text); " +
                    "return NEW; " +
                    "END; " +
                    "$$ LANGUAGE plpgsql;", function (err, res) {

                    done();

                    client.query("CREATE TRIGGER run_update BEFORE UPDATE ON runmessage FOR EACH ROW EXECUTE PROCEDURE run_update();", function (err, res) {
                        done();
                    });


                });

            }
        });

        console.log("create result trigger");
        client.query("DROP TRIGGER IF EXISTS result_update ON result", function (err, res) {
            if (!err) {
                done();

                client.query("CREATE OR REPLACE FUNCTION result_update() RETURNS TRIGGER AS $$ " +
                    "BEGIN " +
                    "PERFORM pg_notify('result_update', row_to_json(NEW)::text); " +
                    "return NEW; " +
                    "END; " +
                    "$$ LANGUAGE plpgsql;", function (err, res) {

                    done();

                    client.query("CREATE TRIGGER result_update BEFORE INSERT ON result FOR EACH ROW EXECUTE PROCEDURE result_update();", function (err, res) {
                        done();
                    });
                });

            }
        });

        client.query('SELECT relname FROM pg_class WHERE relname = $1', ['autoexecution'], function (err, result) {
            if (err)
                return console.error('error running query', err);

            done();

            if (result.rows.length == 0) {
                console.log('Autoexecution table does not exist, creating  .. :-)');

                client.query('CREATE TABLE autoexecution (id serial primary key, autoexe json)', function (err, result) {
                    if (err)
                        return console.error('error running query', err);

                    done();
                });
            }
        });


        var createAvailableScriptsTable = function() {
            //Create availableScripts table and triggers for update and delete
            var parameter = 'availablescripts';
            client.query('SELECT relname FROM pg_class WHERE relname = $1', [parameter], function (err, result) {
                if (err)
                    return console.error('error running query for ' + parameter, err);

                done();

                if (result.rows.length == 0) {
                    console.log(parameter + ' table does not exist, creating  .. :-)');

                    client.query('CREATE TABLE ' + parameter +
                        ' (id integer NOT NULL PRIMARY KEY, rtuple json)' +
                        ' WITH (OIDS=FALSE);' +
                        ' ALTER TABLE ' + parameter + ' OWNER TO workbench;', function (err, result) {
                        if (err)
                            return console.error('error running query for ' + parameter, err);

                        done();
                        client.query('CREATE OR REPLACE RULE addrscript AS' +
                            ' ON INSERT TO ' + parameter + ' DO  SELECT pg_notify(\'addrscript\'::text, new.rtuple::text) AS pg_notify;', function (err, res) {
                            done();
                            client.query('CREATE OR REPLACE RULE deleterscript AS' +
                                ' ON DELETE TO ' + parameter + ' DO  SELECT pg_notify(\'deleterscript\'::text, old.rtuple::text) AS pg_notify;', function (err, res) {
                                done();
                            });
                        });
                    });
                }
            });
        };

        createAvailableScriptsTable();

        var createRScriptLinkGroupsTable = function () {
            //Create rscriptlinkgroup table and triggers for update and delete
            var parameter = 'rscriptlinkgroups';
            client.query('SELECT relname FROM pg_class WHERE relname = $1', [parameter], function (err, result) {
                if (err)
                    return console.error('error running query for ' + parameter, err);

                done();

                if (result.rows.length == 0) {
                    console.log(parameter + ' table does not exist, creating  .. :-)');
                    var q = 'CREATE TABLE ' + parameter +
                        ' (id integer NOT NULL PRIMARY KEY, link json)' +
                        ' WITH (OIDS=FALSE);' +
                        ' ALTER TABLE ' + parameter + ' OWNER TO workbench;';
                    client.query('CREATE TABLE ' + parameter +
                        ' (id integer NOT NULL PRIMARY KEY, link json)' +
                        ' WITH (OIDS=FALSE);' +
                        ' ALTER TABLE ' + parameter + ' OWNER TO workbench;', function (err, result) {
                        if (err)
                            return console.error('error running query for ' + parameter, err);

                        done();
                    });
                }
            });
        };

        createRScriptLinkGroupsTable();

        // all done

        console.log('All done :)');
        console.log('Please be patient as i close all connections :)');
    }
);