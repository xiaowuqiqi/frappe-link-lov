from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in lov/__init__.py
from lov import __version__ as version

setup(
	name="lov",
	version=version,
	description="lov-A mini popup of selected data, which helps us to better display the data to be selected",
	author="wz1024",
	author_email="wuzhanbbb@163.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
