var expect = require("chai").expect;
var tools = require("../../pbkdf2");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var api = require("../../app");

describe("hashPassword() and verifyPassword()", function(){
    it("Should hash the password and decode it correctly", function(){

        var hashedPW = tools.hashPassword("VeryPassword");
        var result = tools.verifyPassword("VeryPassword", hashedPW)

        expect(result).to.equal(true);
    });
} )

describe("asd", function(){
    it("should do smth", function(){
        var result = undefined;

        request('GET', '/apitest', undefined , function () {
            if (this.readyState == 4 && this.status == 200) {
                result = this.response.succes;

                expect(result).to.equal(false);
            }
        });

        

        
    });

})











function request (type, url, sendData, callback) {
    var req = new XMLHttpRequest();
    req.open(type, "https://skilltree.benis.hu/" + url, true);
    req.setRequestHeader('Content-type', 'application/json');
    req.setRequestHeader('x-access-token', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InBhdHJpazEiLCJhZG1pbiI6InRydWUiLCJpYXQiOjE1MTYyMzkwMjJ9.DpR8IB4Ir3YLI7nfcpHRf3L64lEcmv2ixnSh8H1xVaI");
    req.responseType = "json";
    req.onreadystatechange = callback;

    if (sendData !== undefined)
        req.send(JSON.stringify(sendData));
    else
        req.send();
}