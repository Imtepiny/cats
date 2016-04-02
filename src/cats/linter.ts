//
// Copyright (c) JBaron.  All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//


module Cats {

    /**
     * Simple helper class to call tslint functionality
     * Ideally this should be done in the tsworker to offload the main thread, but right now
     * tslint uses require to load modules on the fly and that doesn't function in worker threads
     */ 
    export class Linter {

        private lintOptions:Lint.ILinterOptions;
        private TSLint 

        constructor(private project: Project) {
            this.TSLint = require("tslint");
        }

        private convertPos(item: Lint.RuleFailure): Cats.Range {
            
            var startPosition = item.getStartPosition().getLineAndCharacter();
            var endPosition = item.getEndPosition().getLineAndCharacter();
            
            return {
                start: {
                    row: startPosition.line,
                    column: startPosition.character
                },
                end: {
                    row: endPosition.line,
                    column: endPosition.character
                }
            };
        }

     
        /**
         * Get the configured Lint options
         */
        private getOptions() {
            if (!this.lintOptions) {
                var fileName:string;
                
                if (this.project.config.tslint.lintFile) {
                    fileName = OS.File.join(this.project.projectDir, this.project.config.tslint.lintFile);
                } else {
                    fileName = OS.File.join(IDE.catsHomeDir, "resource/tslint.json");
                }

                var content = OS.File.readTextFile(fileName);
                var config = JSON.parse(content);
                var options:Lint.ILinterOptions = {
                    formatter: "json",
                    configuration: config,
                    rulesDirectory: "customRules/",
                    formattersDirectory: "customFormatters/"
                };
                this.lintOptions = options;
            };
            return this.lintOptions;
        }


        /**
         * Excute lint on the provided content and return the resulting warnings
         * 
         */ 
        lint(fileName:string, content:string) {
            var ll:Lint.Linter = new this.TSLint(fileName, content, this.getOptions());
            // var result: Array<any> = JSON.parse(ll.lint().output);
            var r: Cats.FileRange[] = [];
            var failures = ll.lint().failures;
            failures.forEach((failure) => {
               var item: Cats.FileRange = {
                    fileName: fileName,
                    message: failure.getFailure(),
                    severity: Cats.Severity.Info,
                    range: this.convertPos(failure)
                };
                r.push(item);
                
            });
    
            return r;
        }
    }
}
