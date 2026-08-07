import asyncio
from pprint import pprint

from agents.problem_parser import ProblemStatementParserAgent
from agents.llm import LLM

theme = '''
Check web site for more details
Challenge Categories:

Web Security&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
Cryptography
Digital Forensics&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
Reverse Engineering
Binary Exploitation&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;
OSINT&nbsp;
Steganography
Miscellaneous Puzzles&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;
'''
async def main():
    llm = LLM()
    parser = ProblemStatementParserAgent(llm)
    response = await parser.run(theme)

    pprint(response)
    
    
    
if __name__ == "__main__":
    asyncio.run(main())