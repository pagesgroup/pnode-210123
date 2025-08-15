const { Controller, Tag } = require("ethernet-ip");

const PLC = new Controller();

// Maak een Tag object aan
const myTag = new Tag("udtBatchRunParametersLine1.diSet_AmountOfProducts");

(async () => {
    try {
        // Verbind met de PLC (IP, slotnummer meestal 0)
        await PLC.connect("192.168.2.200", 0);

        console.log("Verbonden met PLC:", PLC.properties);

        // Tag registreren bij de PLC
        PLC.subscribe(myTag);

            // Eerst één keer lezen om datatype te bepalen
        await PLC.readTag(myTag);
        console.log("Eerste waarde:", myTag.value, "Type:", myTag.datatype);
        
        // Wacht even tot de eerste cyclus is uitgevoerd
        setTimeout(() => {
            console.log("Tagwaarde:", myTag.value);

            // Waarde schrijven
            myTag.value = 123;
            PLC.writeTag(myTag).then(() => {
                console.log("Tag geschreven!");
            });
        }, 1000);

    } catch (err) {
        console.error("Fout bij PLC-verbinding:", err);
    }
})();
