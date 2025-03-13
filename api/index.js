const express = require("express")
const PORT = process.env.PORT || 3002;

const app = express()
app.use(express.json());


app.get("/kaizen",(req,res)=>{
    res.json({message : "Hello from Backend server , How are you?"})
})


app.listen(PORT,() => console.log(`Server is running on PORT ${PORT}`));