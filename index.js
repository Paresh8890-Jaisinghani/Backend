const express = require("express")
const PORT = process.env.PORT || 3000;

const app = express()
app.use(express.json());


app.get("/",(req,res)=>{
    res.json({message : "Hello from Backend server , How are you?"})
})


app.listen(PORT,() => console.log(`Server is running on PORT ${PORT}`));