const forgot = document.getElementById('forgot');
const email = document.getElementById('email');

forgot.addEventListener('submit', (e)=>{
    e.preventDefault();

    forgotObject = {email: email.value}

    axios.post('http://localhost:3000/password/forgotpassword',forgotObject)
        .then((response) => {
            alert(response.data.message);
        }).catch((err) => {
            console.log(err);
            document.body.innerHTML += err.response.data.error;
        });
})