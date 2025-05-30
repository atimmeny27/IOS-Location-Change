# IOS-Location-Change

A web-based simulator that lets you spoof your iOS device’s location using Mapbox. 
Easily change your location by launching the flask server and connecting an iPhone or iPad via usb to a Macbook.

# To Install
1. Copy these commands below and paste into terminal ('command' + 'space', search Terminal)
```bash
git clone https://github.com/atimmeny27/IOS-Location-Change
cd IOS-Location-Change
python3 -m pip install -r requirements.txt
clear
```
2. Connect your iPhone to Macbook via usb cable, unlock it and trust it
3. Once this is done, paste this in
```bash
python3 main.py
```
4. Either enter below into your web browser, or hold 'command' then click where it says (http://127.0.0.1:2787)
```bash
http://127.0.0.1:2787
```
5. Make sure to press 'Control' + 'C' in the terminal when you are done to close the port, note if you close the port your location will return to where it actually is.
6. For future use, all that is required is 
```bash
cd IOS-Location-Change
python3 main.py
```


Originally forked from the git repo below and done as a project to work on my frontend html/css as well as backend logic, most of which was from the original repository.
```bash
https://github.com/alexdalat/ios-virtual-loc
```

## Video Tutorial (Instiallation)
Once you have git cloned with step 1, search for install.mp4 inside of finder

## Video Tutorial (How To Use)
Once you have git cloned with step 1, search for use.mp4 inside of finder

