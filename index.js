require('dotenv').config();
const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REDIRECT_URI = process.env.REDIRECT_URI

// Dependencias
const express = require('express');
const queryString = require('querystring')
const axios = require('axios')

const app = express();
const port = 8888;

//Auxiliares
const generateRandomString = length => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

app.get('/', (req, res) => {
    const data = {
        name: 'XXX',
        isAwesome: true,
    };

    res.json(data);
    console.log("hola");
});

app.get('/awesome-generator', (req, res) => {
    const { name, isAwesome } = req.query;
    res.send(`${name} is ${JSON.parse(isAwesome) ? 'really' : 'not'} awesome`);
});

const stateKey = 'spotify_auth_state'
app.get('/login', (req, res) => {
    const state = generateRandomString(16);
    res.cookie(stateKey, state)
    // alcance al acceder al login(solo lectura de datos y correo)
    const scope = 'user-read-private user-read-email'
    //res.redirect(`https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}`);
    const queryParams = queryString.stringify({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        state: state,
        scope: scope,
    })
    res.redirect('https://accounts.spotify.com/authorize?' + queryParams)
});

/**
 * callback producido de la edirección de URI(callback())
 * @see Este callback tiene el code y state del redirect
 * @see usamos este code para pedir token una  vez logeados
 * 
 */
app.get('/callback', (req, res) => {
    const {code , state} = req.query || null
    // solicutd http (post) envio de recursos
    axios(
        {
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            data: queryString.stringify({
                code: code,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            }),
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
            }
        }
    ).then(result => {
        // if (result.status === 200)
        // {
        //     res.send(`<pre>${JSON.stringify(result.data, null, 2)}</pre>`);
        // } else {
        //     res.send(result)
        // }
        //Modificamos para realizar consulta usando el token de result.data
        if (result.status === 200) {
            console.log('Estoy en callback status200')
            console.log(`${JSON.stringify(result.data, null, 3)}`);
            // const { access_token, token_type } = result.data; // peticion datos spotify

            const { refresh_token } = result.data; // genera nuevo token para no realizar logut de usuario

            // axios({
            
            //     method: 'get',
            
            //     url: 'https://api.spotify.com/v1/me',
            
            //     headers: {
            //         Authorization: `${token_type} ${access_token}`
            //     }
            
            // })

            //---refreshtoken
            axios.get(`http://localhost:8888/refresh_token?refresh_token=${refresh_token}`)
            //--refresh
            // respuesta al enviar get con token al servidor
            
                .then(result => {res.send(`<pre>${JSON.stringify(result.data, null, 2)}</pre>`)
                    console.log('Viendo respuesta');

                    console.log(`${JSON.stringify(result.data, null, 3)}`)}

                )
                
                .catch(error => res.send(error));
            
        } else {
            res.send(result)
        }
        
    }).catch((err) => {
        res.send(err)
    });
})

app.get('/refresh_token', (req, res) => {
    console.log('Estoy en / refresh token');

    const { refresh_token } = req.query;
  
    axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: queryString.stringify({
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      }),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
      },
    })
      .then(response => {
        console.log('Estoy en refreshToken')
        console.log(response.data)
        res.send(response.data);
      })
      .catch(error => {
        res.send(error);
      });
});

app.listen(port, () => {
    console.log(`Express app listening at http://localhost:${port}`);
});
