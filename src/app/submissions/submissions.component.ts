import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ValueServiceService } from '../value-service.service';
import { Router } from '@angular/router';
import { UploadService } from './upload.service';
import { Timestamp } from 'rxjs';

@Component({
  selector: 'app-submissions',
  templateUrl: './submissions.component.html',
  styleUrls: ['./submissions.component.scss']
})
export class SubmissionsComponent {
  public selectedFile: File;
  fileName = '';

  public challenge_id: number;
  public is_public: boolean;
  public user_id: number;
  public score: number;
  public challengeLimit: number;

  constructor(private uploadService: UploadService, private valueService: ValueServiceService) {}

  onFileChange(event: any) {
	  this.selectedFile = event.target.files[0];
  }

  submitForm() {
    this.challenge_id = parseInt(localStorage.getItem('current_challenge'));
    if (this.selectedFile) { 
      this.fileName = this.selectedFile.name;
      if(this.fileName.substring(this.fileName.lastIndexOf('.')+1) != "csv"){
        alert("incorrect file type")
      } else {
        var response: Object[];
        var testFlag: Object[];
        var splitResp2: Object[];
        localStorage.setItem('CID', this.challenge_id.toString());

        const compareNow = new Date();
        const timestamp = compareNow.getTime();
        var publicSD = new Date(localStorage.getItem("public_start_date")).getTime();
        var privateED = new Date(localStorage.getItem("private_end_date")).getTime();
        var publicED = new Date(localStorage.getItem("public_end_date")).getTime();
        var privateSD = new Date(localStorage.getItem("private_start_date")).getTime();
        if ((publicSD < timestamp) && (timestamp < privateED)) {
          // if date > public end date and date < less than private start date
          if ((timestamp > publicED) && (timestamp < privateSD)) { 
            alert('submission is outside of set time limit')
          } else {
            var valid = true;

            // Upload Service: Check User Submissions
            this.uploadService.checkUserSubmissions(parseInt(localStorage.getItem('UID')), this.challenge_id).subscribe((data: Object[]) => {
              if (data['status'] == '0') {
                var submissionsLeft = data['submissions_left'] - 1;
                alert('submissions left: ' + submissionsLeft); 
              
                // Upload Service: Get Dates
                this.uploadService.getDates(localStorage.getItem('CID')).subscribe((data: Object []) => {
                  response = data;
                  var resp = JSON.stringify(response[0]);
                  resp = resp.replaceAll("\":\"", ",");
                  resp = resp.replaceAll(".", ",");
                  resp = resp.replaceAll("-", "/");
                  resp = resp.replaceAll("T", " ");
                  resp = resp.replaceAll("}", ",");
                  var splitResp = resp.split(",");
                  var public_end_date = new Date(splitResp[1]).getTime();
                  var private_end_date = new Date(splitResp[4]).getTime();
                  const now = new Date().getTime();
                  if(now < public_end_date) {
                    this.is_public = true;
                  } else if(now > public_end_date && now < private_end_date) {
                    this.is_public = false;
                  }

                  // Upload Service: Sent Info
                  this.uploadService.sentInfo(this.fileName, this.challenge_id, this.is_public, parseInt(localStorage.getItem('UID')), this.score).subscribe(resp => {
                    //alert("sent");

                    // Upload Service: Get Submission ID
                    this.uploadService.getSubmissionID(parseInt(localStorage.getItem('UID'))).subscribe((data: Object[]) => {
                      response = data;
                      var resp = JSON.stringify(response[0]);
                      resp = resp.replaceAll(":", ",");
                      resp = resp.replaceAll("}", ",");
                      var splitResp = resp.split(",");
                      
                      // Upload Service: Add Submission
                      this.uploadService.addSubmission(this.selectedFile, splitResp[1]).subscribe(resp => {
                        alert("uploaded")
                      });

                      // Upload Service: Get Test Flag
                      this.uploadService.getTestFlag(localStorage.getItem('CID')).subscribe((data: Object[]) => {
                        testFlag = data;
                        var resp2 = JSON.stringify(testFlag[0]);
                        resp2 = resp2.replaceAll(":", ",");
                        resp2 = resp2.replaceAll("}", ",");
                        resp2 = resp2.replaceAll(/["']/g, ",");
                        var splitResp2 = resp2.split(",");

                        // Upload Service: Compute Score
                        this.uploadService.computeScore(parseInt(splitResp[1]), splitResp2[4].toString()).subscribe(resp => {});
                      });
                    });
                    // alert("computed")
                  });
                });
              } else {
                valid = false;
                alert('no more submissions for this challenge');
              }
            });
          }
        } else {
          alert('submission is outside of time limit');
        }
      }
    } else {
      alert("please select a file first")
    }
  }
  
  public getItem(item:string){
    return localStorage.getItem(item);
  }

  public downloadFile(){
    // allows user to download the sample data for that challenge
    this.valueService.downloadSample().subscribe(results => {
      let blobUrl = URL.createObjectURL(results);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = localStorage.getItem("challenge_name")+"_sample.csv"; // set a name for the file
      link.click();
    });
  }
}
