import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))
from common_utils import utils as cutils
print("Is example.com in public domains?", cutils.check_domain_in_list("coordinator@example.com"))
