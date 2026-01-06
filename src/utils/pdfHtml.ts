export const getPdfHtml = (url: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF Viewer</title>
    <style>
        body { margin: 0; padding: 0; background-color: #333; height: 100vh; display: flex; flex-direction: column; }
        #the-canvas { width: 100%; height: 100%; object-fit: contain; }
        #container { flex: 1; overflow: auto; display: flex; justify-content: center; align-items: flex-start; background: #333; }
        .page { margin-bottom: 10px; box-shadow: 0px 0px 5px rgba(0,0,0,0.5); }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    </script>
</head>
<body>
    <div id="container"></div>
    <script>
        const url = '${url}';
        const container = document.getElementById('container');

        const loadingTask = pdfjsLib.getDocument(url);
        loadingTask.promise.then(function(pdf) {
            // Render all pages
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                pdf.getPage(pageNum).then(function(page) {
                    const scale = 1.5;
                    const viewport = page.getViewport({scale: scale});
                    
                    const canvas = document.createElement('canvas');
                    canvas.className = 'page';
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    // Adjust canvas style width for responsiveness
                    canvas.style.width = '100%';
                    canvas.style.height = 'auto'; // Maintain aspect ratio

                    container.appendChild(canvas);

                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    page.render(renderContext);
                });
            }
        }, function (reason) {
            // Error handling
            console.error(reason);
            document.body.innerHTML = '<div style="color:white; padding:20px; text-align:center;">Error loading PDF: ' + reason.message + '</div>';
        });
    </script>
</body>
</html>
`;
