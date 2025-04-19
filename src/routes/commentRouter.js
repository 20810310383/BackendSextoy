const express = require("express");
// import { createComment, deleteComment, getComment } from '../controllers/Comments/comment.controller';
const { createComment, deleteComment, getComment } = require('../controllers/Comments/comment.controller');
const router = express.Router();

// find all comment
router.get("/get-comment", getComment );
// router.get("/get-comment", comment.getComment );

// tao moi comment
router.post("/create-comment", createComment );

// delete comment
router.delete("/delete-comment/:id", deleteComment );

module.exports = router;