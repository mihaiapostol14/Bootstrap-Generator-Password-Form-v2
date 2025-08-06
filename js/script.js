let Btncopy = document.querySelector('.copy-icon')
Btncopy.addEventListener('click', function () {
  let Passwordinput = document.querySelector('.show-password')

  Passwordinput.select()
  Passwordinput.setSelectionRange(0, 99999) // For mobile devices
  navigator.clipboard
    .writeText(Passwordinput.value)
    .then(() => alert('Text copied: ' + Passwordinput.value))
    .catch(err => console.error('Error copying text: ', err))
})
