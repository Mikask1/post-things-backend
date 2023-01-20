import PostMessage from "../models/postMessage.js"
import mongoose from "mongoose"
import path from "path";
import { writeFileSync } from "fs";

import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

export const getPosts = async (req, res) => {
    try {
        var postMessages = await PostMessage.find()


        res.status(200).json(postMessages)
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const createPost = async (req, res) => {
    
    try {
        const post = req.body
        
        const newPost = new PostMessage({ ...post, userId: req.userId, createdAtProperty: new Date().toISOString() })
        await newPost.save()
        
        const fileType = newPost.file.split(";")[0].split("/")[1]
        const base64Data = newPost.file.split(",")[1]
        
        const fileName = `${newPost._id}.${fileType}`

        writeFileSync(path.join(__dirname, `../images/${fileName}`), base64Data, 'base64')
        const updatedPost = await PostMessage.findByIdAndUpdate(newPost._id, {file: fileName}, {new: true})
        
        res.status(201).json(updatedPost)
    }
    catch (error) {
        res.status(409).json({ message: error.message })
    }
}

export const updateLike = async (req, res) => {
    try {

        if (!req.userId) {
            return res.json({ message: "Unauthenticated" })
        }
        const { postID } = req.params;
        const { likes } = req.body

        if (!mongoose.Types.ObjectId.isValid(postID)) return res.status(404).send("404 - No post with that ID was found");

        const post = await PostMessage.findById(postID)

        const index = post.likes.findIndex((id) => id === String(req.userId))
        if (index === -1) {
            post.likes.push(req.userId) // like
        }
        else {
            post.likes = post.likes.filter((id) => id !== String(req.userId)) // remove like
        }

        const updatedPost = await PostMessage.findByIdAndUpdate(postID, post, { new: true });

        res.status(200).json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updatePost = async (req, res) => {
    try {
        const { postID } = req.params
        const post = req.body

        if (!mongoose.Types.ObjectId.isValid(postID)) return res.status(404).send("404 - No post with that ID was found")
        
        const file = post.file
        const fileType = file.split(";")[0].split("/")[1]
        
        if (fileType){ // if file is updated
            const base64Data = file.split(",")[1]

            const fileName = `${postID}.${fileType}`

            writeFileSync(path.join(__dirname, `../images/${fileName}`), base64Data, 'base64')
            const updatedPost = await PostMessage.findByIdAndUpdate(postID, { ...post, _id: postID, file: fileName }, { new: true });
            res.status(200).json(updatedPost);
        }
        else{
            const updatedPost = await PostMessage.findByIdAndUpdate(postID, { ...post, _id: postID }, { new: true });
            res.status(200).json(updatedPost);
        }
        
        
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const deletePost = async (req, res) => {
    try {
        const { postID } = req.params

        if (!mongoose.Types.ObjectId.isValid(postID)) return res.status(404).send("404 - No post with that ID was found")

        await PostMessage.findByIdAndRemove(postID)

        res.status(200).json({ message: `Succesfully deleted ${postID}` })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const addComment = async (req, res) => {
    try {
        const { postID } = req.params
        const { comment, userId, name } = req.body

        if (!mongoose.Types.ObjectId.isValid(postID)) return res.status(404).send("404 - No post with that ID was found")

        var post = await PostMessage.findById(postID)

        post.comments.unshift({ message: comment, userId, name, createdAtProperty: new Date().toISOString() })
        const updatedPost = await PostMessage.findByIdAndUpdate(postID, { ...post }, { new: true })

        res.status(200).json(updatedPost)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const deleteComment = async (req, res) => {
    try {
        const { postID, commentID } = req.params

        if (!mongoose.Types.ObjectId.isValid(postID)) return res.status(404).send("404 - No post with that ID was found")

        var post = await PostMessage.findById(postID)

        const newComments = post.comments.filter((comment) => String(comment._id) !== String(commentID))
        
        post.comments = newComments
        const updatedPost = await PostMessage.findByIdAndUpdate(postID, { ...post }, { new: true })

        res.status(200).json(updatedPost)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getImage = async (req, res) => {
    try {
        const { fileName } = req.params

        // if (!mongoose.Types.ObjectId.isValid(postID)) return res.status(404).send("404 - No post with that ID was found")

        res.sendFile(path.join(__dirname, `../images/${fileName}`));
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const doThis = async (req, res) => {
    try {
        var postMessages = await PostMessage.find()
        for (const post of postMessages){
            console.log(post.file)
        }
        
        res.send("done")
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
