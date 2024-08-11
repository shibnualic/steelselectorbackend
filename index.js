
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const { Schema } = mongoose;
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();



app.use(express.json());
app.use(cors());


//Database connection with mongoDB

mongoose.connect(process.env.MONGODB_URL);

app.get("/", (req, res) => {
    res.send("Express server is running")
})

const propertyRatingSchema = new Schema({

    corrosion_resistence: {
        type: Number,
        required: true
    },
    durability: {
        type: Number,
        required: true
    },
    weldability: {
        type: Number,
        required: true
    },
    strengthByWeight: {
        type: Number,
        required: true
    },
    strengthByCost: {
        type: Number,
        required: true
    },
    abrasionResistance: {
        type: Number,
        required: true
    }
}, { _id: false });
// all values are in imperial unit system.
const propertyValueSchema = new Schema({
    thickness: {
        type: Number,
        required: true
    },
    density: {
        type: Number,
        required: true
    },
    min_inside_radius: {
        type: Number,
        required: true
    },
    tensile_strength: {
        type: Number,
        required: true
    },
    yield_strength: {
        type: Number,
        required: true
    }
}, { _id: false })



const Steel = mongoose.model("steel", {
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    gauge: {
        type: String,
        required: true
    },
    surface_treatment: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    property_ratings: {
        type: propertyRatingSchema,
        required: true
    },
    property_values: {
        type: propertyValueSchema,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
})

const Vendor = mongoose.model("vendor", {
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },

    street_number: {
        type: String,
        required: true
    },
    street_name: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    province: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }

})

app.post("/addsteel", async (req, res) => {

    let steels = await Steel.find({});
    let id;
    if (steels.length > 0) {
        let lastSteelArray = steels.slice(-1);
        let lastSteel = lastSteelArray[0];
        id = lastSteel.id + 1
    } else {
        id = 1
    }
    const steel = new Steel({
        id: id,
        name: req.body.name,
        gauge: req.body.gauge,
        surface_treatment: req.body.gauge,
        category: req.body.category,
        property_ratings: {
            corrosion_resistence: req.body.corrosion_resistence,
            durability: req.body.durability,
            weldability: req.body.weldability,
            strengthByWeight: req.body.strengthByWeight,
            strengthByCost: req.body.strengthByCost,
            abrasionResistance: req.body.abrasionResistance
        },
        property_values: {
            thickness: req.body.thickness,
            density: req.body.density,
            min_inside_radius: req.body.min_inside_radius,
            tensile_strength: req.body.tensile_strength,
            yield_strength: req.body.yield_strength
        }
    })
    console.log(steel);
    await steel.save();
    console.log("saved");
    res.json({
        success: true,
        name: req.body.name
    }
    )
})

app.get("/allsteel", async (req, res) => {
    let steel = await Steel.find({});
    res.send(steel);
})

app.post("/bestmatchsteel", async (req, res) => {
    console.log(req.body);
    const searchCriteria = {
        [req.body.property1]: req.body.property1rate,
        [req.body.property2]: req.body.property2rate,
        [req.body.property3]: req.body.property3rate,
        [req.body.property4]: req.body.property4rate,
        [req.body.property5]: req.body.property5rate,
    }
    console.log(searchCriteria);
    try {
        if (!searchCriteria || typeof searchCriteria !== 'object' || !Object.keys(searchCriteria).length) {
            console.log('Properties are required and must be an object');
        }
        const keys = Object.keys(searchCriteria);
        let bestSteel;
        if (keys[0] === '') {
            bestSteel = await Steel.find({ gauge: req.body.gauge });
            res.send(bestSteel);
        } else {
        
            // Try to find user by matching decreasing number of searchCriteria
            for (let i = keys.length; i > 0; i--) {
                const query = {};
                keys.slice(0, i).forEach(key => {
                    query[key] = searchCriteria[key];
                });
                bestSteel = await Steel.find(query);
                if (bestSteel.length !== 0) {
                    break;
                }
            }
            bestSteel = bestSteel.filter((item) => item.gauge === req.body.gauge);
            res.send(bestSteel);
        } } catch (error) {
        console.error('Error finding user:', error);
        res.status(500).send('Internal server error');
    }
});

app.post("/addvendor", async (req, res) => {

    let vendors = await Vendor.find({});
    let id;
    if (vendors.length > 0) {
        let lastvendorArray = vendors.slice(-1);
        let lastvendor = lastvendorArray[0];
        id = lastvendor.id + 1
    } else {
        id = 1
    }
    const vendor = new Vendor({
        id: id,
        name: req.body.name,
        street_number: req.body.street_number,
        street_name: req.body.street_name,
        city: req.body.city,
        province: req.body.province,
        rating: req.body.rating,
    })
    console.log(vendor);
    await vendor.save();
    console.log("saved");
    res.json({
        success: true,
        name: req.body.name
    }
    )
})

const adminCredentials = {
    username: 'shibnu@gmail.com',
    password: '12345'
};

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === adminCredentials.username && password === adminCredentials.password) {
        const token = jwt.sign({ username: username }, 'secret_matsel');
        res.json({ token });
        console.log("successfully created token")
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
        console.log("credential failed")
    }
});


app.listen(process.env.PORT, (error) => {
    if (!error) {
        console.log("server running on port 4000")
    } else {
        console.log("Error:" + error)
    }
});



