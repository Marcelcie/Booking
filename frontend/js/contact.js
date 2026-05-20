document.addEventListener("DOMContentLoaded",() => {
    const contactForm = document.getElementById("contact-form")
    if (contactForm){
        contactForm.addEventListener("submit", async(e) => {
            e.preventDefault()

            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            const topic = document.getElementById("topic").value;
            const message = document.getElementById("message").value;
            if (!name || !email || !topic || !message){
                alert("Proszę wypełnić wszystkie pola.");
                return;
            }
            try{
                const response = await fetch("http://127.0.0.1:8000/api/contact/",{
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        "name": name,
                        "email": email,
                        "topic": topic,
                        "message": message
                    })
                });
                if (!response.ok){
                    throw new Error("Błąd podczas wysyłania wiadomości.");
                }
                alert("Wiadomość została wysłana pomyślnie!")
                contactForm.reset();
            }catch (error){
                console.error(error);
                alert("Wystąpił nieoczekiwany błąd. Proszę spróbować ponownie.")
            }
        })
    }
})