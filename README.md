# PNODE-210123

## Aspect interface

### Test demo

- [Pagesgroup Polyamc PNode 210123 Github Repositorie](https://github.com/pagesgroup/pnode-210123)
- [Pagesgroup Polyamc PNode 210123 Github Page](https://pagesgroup.github.io/pnode-210123/)
- [PNode 210123 Application](https://pagesgroup.github.io/pnode-210123/app/public/)
- [PNode 210123 PLT Simulation for testing Aspect](https://pagesgroup.github.io/pnode-210123/plt/public/)


### Optie 1, MQTT

- mqttserver: `mqtt://aliconnect.nl:1884`
- path: `polymac/210123-53084127-A96C-4D2C-9835-90E684BE06EA`

1. Aspect Write
    1. Batch Data
        - destinationName: `/aspect/write/batchdata`
        - payloadString: prevert: JSON representation of CSV file data | optional: CSV data
            1. `JobId`: Job control	Communication between Aspect and PC	(max length: 40)
            1. `JobRun`: Job control	Communication between Aspect and PC	(max length: 3)
            1. `DesiredYield`: Amount of products to be produced	Used for batch control in PLT (max length: 8)
            1. `MaterialID`: Name to be printed on the label	Printer in the box packing (max length: 30)
            1. `ScheduleIndex`: Production sequence	Used to order the Jobs (max length: 3)
            1. `ResinCode`: Not used (max length: 15)
            1. `Masterbatchcode`: Not used (max length: 15)
            1. `IMLCode`: Not used (max length: 40)
            1. `WorkOrderID`:  (max length: 15)
            1. `MachineID`:  (max length: 10)
            1. `BoxQty`: Not used (max length: 3)
            1. `PalletQty`: Not used (max length: 5)
            1. `MODE`: Not used (max length: 5)
            1. `LBLBARCODE`: Code to be printed on the label	Printer in the box packing (max length: 15)
            1. `LBLITEMNUMB`: Not used (max length: 15)
            1. `LBLNAME`: Name to be printed on the label	Printer in the box packing (max length: 40)
            1. `LBLNSN`: Not used (max length: 10)
            1. `IMLBARCODE`: Code on the label	Label check in the PLT (max length: 15)
            1. `IMLBARCODELOC`: Position of code on the label	Label check in PLT (Top/Bottom/No) (max length: 2)
            1. `LBLNATO`: Not used (max length: 10)
            1. `LBLISD`: Not used (max length: 10)
1. Aspect Read
    1. Job Change
        - destinationName: `/aspect/read/jobchange`
        - payloadString: prevert: JSON representation
            1. `DateTime`: Current date time in ISO format
            1. `JobID`: row.JobID,
            1. `JobRun`: row.JobRun,
            1. `MaterialID`: row.MaterialID,
            1. `LBLNAME`: row.LBLNAME,
    1. Finished cartons
        - destinationName: `/aspect/read/finishedcartons`
        - payloadString: prevert: JSON representation
            1. `DateTime`: Current date time in ISO format
            1. `JobID`: Job ID of active Batch
            1. `BoxQtyActual`: Number of boxes produced
            1. `FinishedCartons`: Number of products produced
    1. Rejects
        - destinationName: `/aspect/read/rejects`
        - payloadString: prevert: JSON representation
            1. Array of
                1. `DateTime`: Current date time in ISO format
                1. `JobID`: Job ID of active Batch
                1. `RejectReasonCode`: 1
                1. `Quantity`: 36

#### Optie 2, CSV file format

- Comma seperated
- Periodiek wegschrijven naar `{folder}`

c:\Polymac\
c:\Polymac\ErrorInfo
c:\Polymac\ErrorInfo\Error
c:\Polymac\ErrorInfo\Processed
c:\Polymac\FinishedCartons
c:\Polymac\Rejects
c:\Polymac\JobChange
c:\Polymac\JobInfo
c:\Polymac\JobInfo\Error
c:\Polymac\JobInfo\Processed
c:\Polymac\Logging

Columns
1. JobID
1. JobRun
1. DesiredYield
1. MaterialID
1. ScheduleIndex
1. ResinCode
1. MasterbatchCode
1. IMLCode
1. WorkOrderID
1. MachineID
1. BoxQty
1. PalletQty
1. MODE
1. LBLBARCODE
1. LBLITEMNUMB
1. LBLNAME
1. LBLNSN
1. IMLBARCODE
1. IMLBARCODELOC
1. LBLNATO
1. LBLJSD

