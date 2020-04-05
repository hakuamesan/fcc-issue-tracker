/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb");
var ObjectId = require("mongodb").ObjectID;

const CONNECTION_STRING = process.env.MONGO_URI; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function(app) {
  app
    .route("/api/issues/:project")

    .get(function(req, res) {
      var project = req.params.project;

      var query = req.query;
      if (query._id) { query._id = new ObjectId(query._id)}
      if (query.open) { query.open = String(query.open) == "true" }
    
      MongoClient.connect(CONNECTION_STRING, {useNewUrlParser: true, useUnifiedTopology: true}, (err, db) => {
        db.db("mytestdb").collection(project)
          .find(query)
          .toArray((err, doc) => {
            if (err) console.error(err);
            res.send(doc);
          });
      });
    })

    .post(function(req, res) {
      var project = req.params.project;

      var issue = {
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to || "",
        status_text: req.body.status_text || "",
        created_on: new Date(),
        updated_on: new Date(),
        open: true
      };

      if (!issue.issue_title || !issue.issue_text || !issue.created_by) {
        res.send("Missing required inputs!");
      } else {
        MongoClient.connect(CONNECTION_STRING, {useNewUrlParser: true, useUnifiedTopology: true}, (err, db) => {
          db.db("mytestdb").collection(project).insertOne(issue, function(err, doc) {
            if (err) console.error(err);
            res.json(issue);
          });
        });
      }
    })

    .put(function(req, res) {
       var project = req.params.project;
      var id = req.body._id;
      console.log("proj=" + project + " id="+id);  
    
      var updates = {
        issue_title: req.body.issue_title || '',
        issue_text: req.body.issue_text || '',
        created_by: req.body.created_by || '',
        assigned_to: req.body.assigned_to || '',
        status_text: req.body.status_text || '',
        issue_open: req.body.open, 
      }
      
    
      //delete any props that are empty
      for(let prop in updates) {
       console.log("updating:" + updates[prop]);

        if(updates[prop] === '') { delete updates[prop]}
      }
    
      if(Object.keys(updates).length === 0) {
        res.send('No updated field sent!!!');
      } else {
      updates.updated_on = new Date();
      updates.open = req.body.open === 'false' ? false : true;
      MongoClient.connect(CONNECTION_STRING, {useNewUrlParser: true, useUnifiedTopology: true}, (err, db) => {
        db.db("mytestdb").collection(project).findAndModify({_id: ObjectId(id)}, //need ObjectId because _id property is object
                                             {},
                                             {$set: updates},
                                             {new: true},
                                             (err, doc) => {
          (err) ? res.send('Could not update ' + id) : res.send('Issue successfully updated');
        });
       });
      }
    
    
    })

    .delete(function(req, res) {
      var project = req.params.project;
      var id = req.body._id;
      console.log(id);
      if (!id) {
        res.send("_id error");
      } else {
        MongoClient.connect(CONNECTION_STRING, {useNewUrlParser: true, useUnifiedTopology: true}, (err, db) => {
          db.db("mytestdb").collection(project).deleteOne(
            { _id: ObjectId(id) },
            (err, doc) => {
              err? res.send("Could not delete " + id) : res.send("Deleted " + id);
            }
          );
        });
      }
    });
};
