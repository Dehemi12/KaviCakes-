import zipfile
import xml.etree.ElementTree as ET
import sys

def extract_text(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.XML(xml_content)
            namespace = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            paragraphs = []
            for paragraph in tree.iterfind('.//w:p', namespace):
                texts = [node.text for node in paragraph.iterfind('.//w:t', namespace) if node.text]
                if texts:
                    paragraphs.append(''.join(texts))
            with open('extracted_text.txt', 'w', encoding='utf-8') as f:
                f.write('\n'.join(paragraphs))
    except Exception as e:
        with open('extracted_text.txt', 'w', encoding='utf-8') as f:
            f.write(str(e))

extract_text(sys.argv[1])
